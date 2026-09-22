import asyncpg
from pgvector.asyncpg import register_vector

from mindlink.core.config import Settings


async def _init_connection(conn: asyncpg.Connection) -> None:
    # Supabase installs extensions into the `extensions` schema.
    await register_vector(conn, schema="extensions")


async def create_pool(settings: Settings) -> asyncpg.Pool:
    """Pool for the backend role.

    Use a direct or session-mode pooler URL (port 5432): the transaction-mode pooler does not
    support the prepared statements asyncpg relies on.
    """
    return await asyncpg.create_pool(
        dsn=settings.database_url.get_secret_value(),
        min_size=1,
        max_size=settings.db_pool_max_size,
        init=_init_connection,
        command_timeout=30,
    )
