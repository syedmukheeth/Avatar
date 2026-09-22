import re

# Order matters: strip whole bearer headers and JWTs before generic token shapes.
_RULES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"(?i)\bbearer\s+\S+"), "Bearer [redacted]"),
    (re.compile(r"\beyJ[\w-]+\.[\w-]+\.[\w-]*"), "[jwt]"),
    (re.compile(r"https?://\S+"), "[url]"),
    (re.compile(r"[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}"), "[email]"),
    (re.compile(r"\b(?:sk|pk|sb|gsk|AIza)[\w-]{10,}"), "[key]"),
    # No "-" in the class, so UUIDs survive.
    (re.compile(r"\b[A-Za-z0-9+/_]{32,}={0,2}"), "[token]"),
]


def safe_diagnostic(value: object, limit: int = 300) -> str:
    """Render an error or provider response so it is safe to log or store.

    Removes credentials, JWTs, URLs and email addresses, collapses whitespace and truncates.
    """
    text = " ".join(str(value).split())
    for pattern, replacement in _RULES:
        text = pattern.sub(replacement, text)
    if len(text) > limit:
        text = text[: limit - 1] + "…"
    return text
