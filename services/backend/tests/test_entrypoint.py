import importlib
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


def test_vercel_entrypoint_serves_the_prefixed_api(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ENV", "development")
    monkeypatch.syspath_prepend(str(Path(__file__).resolve().parents[1]))
    sys.modules.pop("main", None)
    main = importlib.import_module("main")
    with TestClient(main.app) as client:
        assert client.get("/api/backend/health").json() == {"status": "ok"}
