from typing import Any

import pytest

from mindlink.core.config import Settings


def make_settings(**overrides: Any) -> Settings:
    """Settings from explicit values only, so tests never read a developer's `.env`."""
    return Settings(_env_file=None, **overrides)  # pyright: ignore[reportCallIssue]


@pytest.fixture
def settings() -> Settings:
    return make_settings(
        env="development",
        supabase_url="http://127.0.0.1:54321",
        allowed_origins=["http://localhost:3000"],
    )
