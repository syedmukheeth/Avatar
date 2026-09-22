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

    Long-running processes (worker, voice) use a direct or session-mode pooler URL (port 5432).
    Serverless functions use the transaction pooler (port 6543) with
    DB_STATEMENT_CACHE_SIZE=0, because it cannot keep prepared statements between transactions.
    """
    return await asyncpg.create_pool(
        dsn=settings.database_url.get_secret_value(),
        min_size=1,
        max_size=settings.db_pool_max_size,
        statement_cache_size=settings.db_statement_cache_size,
        init=_init_connection,
        command_timeout=30,
    )


# Vercel gives shutdown hooks 500 ms after SIGTERM.
_CLOSE_BUDGET_SECS = 0.4


async def close_pool(pool: asyncpg.Pool) -> None:
    """Close gracefully, but never overrun the platform shutdown budget."""
    try:
        async with asyncio.timeout(_CLOSE_BUDGET_SECS):
            await pool.close()
    except TimeoutError:
        log.warning("db.pool_close_timeout")
        pool.terminate()
