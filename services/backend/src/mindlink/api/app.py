from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mindlink.api.routers import health
from mindlink.core.config import Settings, get_settings
from mindlink.core.db import close_pool, create_pool
from mindlink.core.logging import configure_logging

log = structlog.get_logger()


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(settings)
    if errors := settings.production_errors():
        raise RuntimeError(f"invalid production configuration: {errors}")

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.db = None
        if settings.database_url.get_secret_value():
            app.state.db = await create_pool(settings)
        log.info("api.started", env=settings.env)
        try:
            yield
        finally:
            if app.state.db is not None:
                await close_pool(app.state.db)

    prefix = settings.api_prefix
    app = FastAPI(
        title="MindLink API",
        version="0.1.0",
        lifespan=lifespan,
        openapi_url=None if settings.is_production else f"{prefix}/openapi.json",
        docs_url=None if settings.is_production else f"{prefix}/docs",
        redoc_url=None,
        swagger_ui_oauth2_redirect_url=None,
    )
    app.state.settings = settings
    app.state.role = "api"
    # Same-origin on Vercel; still needed when the web app runs on another port locally.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
        max_age=600,
    )
    app.include_router(health.router, prefix=prefix)
    return app
