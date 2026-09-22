from mindlink.core.redaction import safe_diagnostic


def test_removes_credentials_urls_and_emails() -> None:
    raw = (
        "401 from https://api.cartesia.ai/voices/clone?key=abc for jane.doe@example.com "
        "Authorization: Bearer sb_secret_abcdefghijklmnop token eyJhbGciOi.eyJzdWIiOi.sig "
        "groq gsk_0123456789abcdefghij"
    )
    out = safe_diagnostic(raw)
    for leaked in ("cartesia.ai", "jane.doe", "sb_secret", "eyJhbGciOi", "gsk_0123"):
        assert leaked not in out
    assert "[url]" in out and "[email]" in out and "Bearer [redacted]" in out


def test_keeps_uuids_and_plain_text() -> None:
    text = "character 3f1c2a9e-8b7d-4c6e-9f10-2a3b4c5d6e7f not found"
    assert safe_diagnostic(text) == text


def test_truncates_and_collapses_whitespace() -> None:
    out = safe_diagnostic("word\n\n  " * 200, limit=50)
    assert len(out) == 50 and out.endswith("…") and "\n" not in out
