import structlog
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from mindlink.core.config import Role

log = structlog.get_logger()
router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready")
async def ready(request: Request) -> JSONResponse:
    settings = request.app.state.settings
    role: Role = request.app.state.role
    missing = settings.missing_for(role)

    database_ok = False
    pool = getattr(request.app.state, "db", None)
    if pool is not None:
        try:
            async with pool.acquire() as conn:
                database_ok = await conn.fetchval("select 1") == 1
        except Exception as exc:
            log.warning("ready.database_failed", error_type=type(exc).__name__)

    checks = {"config": not missing, "database": database_ok}
    if missing:
        # Names only, never values; kept out of the response body.
        log.warning("ready.config_missing", missing=missing)
    status_code = 200 if all(checks.values()) else 503
    return JSONResponse(
        {"status": "ready" if status_code == 200 else "not_ready", **checks},
        status_code=status_code,
    )
