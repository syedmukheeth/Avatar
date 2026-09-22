from fastapi.testclient import TestClient

from mindlink.api.app import create_app
from mindlink.core.config import Settings


def test_health_and_ready_without_config(settings: Settings) -> None:
    with TestClient(create_app(settings)) as client:
        assert client.get("/api/backend/health").json() == {"status": "ok"}
        ready = client.get("/api/backend/ready")
        assert ready.status_code == 503
        assert ready.json() == {"status": "not_ready", "config": False, "database": False}


def test_routes_live_only_under_the_prefix(settings: Settings) -> None:
    # Vercel forwards the full path, so an unprefixed route would be unreachable in production.
    with TestClient(create_app(settings)) as client:
        assert client.get("/health").status_code == 404
        assert client.get("/api/backend/openapi.json").status_code == 200


def test_cors_allows_only_configured_origin(settings: Settings) -> None:
    with TestClient(create_app(settings)) as client:
        preflight = {"Access-Control-Request-Method": "GET"}
        ok = client.options(
            "/api/backend/health", headers={"Origin": "http://localhost:3000", **preflight}
        )
        bad = client.options(
            "/api/backend/health", headers={"Origin": "https://evil.example", **preflight}
        )
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert "access-control-allow-origin" not in bad.headers
