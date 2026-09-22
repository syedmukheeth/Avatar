from conftest import make_settings
from fastapi.testclient import TestClient

from mindlink.api.app import create_app
from mindlink.core.config import Settings

PREFLIGHT = {"Access-Control-Request-Method": "GET"}


def test_health_and_ready_without_config(settings: Settings) -> None:
    with TestClient(create_app(settings)) as client:
        assert client.get("/health").json() == {"status": "ok"}
        ready = client.get("/ready")
        assert ready.status_code == 503
        assert ready.json() == {"status": "not_ready", "config": False, "database": False}


def test_cors_allows_only_configured_origin(settings: Settings) -> None:
    with TestClient(create_app(settings)) as client:
        ok = client.options("/health", headers={"Origin": "http://localhost:3000", **PREFLIGHT})
        bad = client.options("/health", headers={"Origin": "https://evil.example", **PREFLIGHT})
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert "access-control-allow-origin" not in bad.headers


def test_cors_regex_admits_preview_deployments_only() -> None:
    settings = make_settings(
        allowed_origins=["https://mindlink.example"],
        allowed_origin_regex=r"^https://avatar-web-[a-z0-9-]+-team\.vercel\.app$",
    )
    preview = "https://avatar-web-git-feature-x-team.vercel.app"
    lookalike = "https://avatar-web-x-team.vercel.app.evil.example"
    with TestClient(create_app(settings)) as client:
        ok = client.options("/health", headers={"Origin": preview, **PREFLIGHT})
        bad = client.options("/health", headers={"Origin": lookalike, **PREFLIGHT})
    assert ok.headers.get("access-control-allow-origin") == preview
    assert "access-control-allow-origin" not in bad.headers
