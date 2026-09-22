from fastapi.testclient import TestClient

from mindlink.api.app import create_app
from mindlink.core.config import Settings


def test_health_and_ready_without_config(settings: Settings) -> None:
    with TestClient(create_app(settings)) as client:
        assert client.get("/health").json() == {"status": "ok"}
        ready = client.get("/ready")
        assert ready.status_code == 503
        assert ready.json() == {"status": "not_ready", "config": False, "database": False}


def test_cors_allows_only_configured_origin(settings: Settings) -> None:
    with TestClient(create_app(settings)) as client:
        ok = client.options(
            "/health",
            headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"},
        )
        bad = client.options(
            "/health",
            headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"},
        )
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert "access-control-allow-origin" not in bad.headers
