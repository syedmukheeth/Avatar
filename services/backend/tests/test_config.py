from conftest import make_settings

from mindlink.core.config import Settings


def test_csv_lists_are_split() -> None:
    s = make_settings(allowed_origins="https://a.com, https://b.com,")
    assert s.allowed_origins == ["https://a.com", "https://b.com"]


def test_missing_for_reports_names_per_role(settings: Settings) -> None:
    assert "SUPABASE_SECRET_KEY" in settings.missing_for("worker")
    assert "SUPABASE_SECRET_KEY" not in settings.missing_for("voice")
    assert "GROQ_API_KEY" not in settings.missing_for("worker")
    assert "CLOUDFLARE_TURN_KEY_ID" not in settings.missing_for("voice")  # dev: TURN optional


def test_production_rejects_insecure_origins() -> None:
    s = make_settings(
        env="production",
        supabase_url="https://x.supabase.co",
        allowed_origins=["http://localhost:3000"],
    )
    assert s.production_errors() == ["origin is not https: http://localhost:3000"]
    assert "CLOUDFLARE_TURN_KEY_ID" in s.missing_for("voice")


def test_production_rejects_unanchored_origin_regex() -> None:
    s = make_settings(
        env="production",
        supabase_url="https://x.supabase.co",
        allowed_origins=["https://mindlink.example"],
        allowed_origin_regex=r"https://.*\.vercel\.app",
    )
    assert s.production_errors() == [
        "ALLOWED_ORIGIN_REGEX must be anchored and https-only (^https://...$)"
    ]


def test_blank_origin_regex_means_unset() -> None:
    assert make_settings(allowed_origin_regex="  ").allowed_origin_regex is None
