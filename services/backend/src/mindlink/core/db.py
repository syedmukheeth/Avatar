import asyncio

import asyncpg
import structlog
from pgvector.asyncpg import register_vector

from mindlink.core.config import Settings

log = structlog.get_logger()


async def _init_connection(conn: asyncpg.Connection) -> None:
    # Supabase installs extensions into the `extensions` schema.
    await register_vector(conn, schema="extensions")


async def create_pool(settings: Settings) -> asyncpg.Pool:
    """Pool for the backend role.

    Use a direct or session-mode pooler URL (port 5432); on hosts without IPv6 egress, such as
    Render, only the session pooler is reachable. The transaction pooler (port 6543) needs
    DB_STATEMENT_CACHE_SIZE=0 because it cannot keep prepared statements between transactions.
    """
    return await asyncpg.create_pool(
        dsn=settings.database_url.get_secret_value(),
        min_size=1,
        max_size=settings.db_pool_max_size,
        statement_cache_size=settings.db_statement_cache_size,
        init=_init_connection,
        command_timeout=30,
    )


# Stay well inside the platform grace period after SIGTERM (Render allows 30 s).
_CLOSE_BUDGET_SECS = 5.0


async def close_pool(pool: asyncpg.Pool) -> None:
    """Close gracefully, but never overrun the platform shutdown budget."""
    try:
        async with asyncio.timeout(_CLOSE_BUDGET_SECS):
            await pool.close()
    except TimeoutError:
        log.warning("db.pool_close_timeout")
        pool.terminate()
