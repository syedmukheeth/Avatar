from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

Role = Literal["api", "worker", "voice"]


class Settings(BaseSettings):
    """Runtime configuration, read from the environment (and `.env` in development)."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    env: Literal["development", "production"] = "development"
    log_level: str = "INFO"
    allowed_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:3000"]
    )

    # Supabase
    supabase_url: str = ""
    supabase_secret_key: SecretStr = SecretStr("")
    database_url: SecretStr = SecretStr("")
    db_pool_max_size: int = 10

    # Providers
    groq_api_key: SecretStr = SecretStr("")
    gemini_api_key: SecretStr = SecretStr("")
    cartesia_api_key: SecretStr = SecretStr("")

    groq_model: str = "openai/gpt-oss-20b"
    embedding_model: str = "gemini-embedding-001"
    embedding_dims: int = 768
    cartesia_tts_model: str = "sonic-3.6"
    cartesia_stt_model: str = "ink-whisper"

    # WebRTC NAT traversal (required for the voice role in production)
    cloudflare_turn_key_id: str = ""
    cloudflare_turn_api_token: SecretStr = SecretStr("")
    turn_ttl_secs: int = 900

    # Voice call limits
    voice_max_call_secs: int = 300
    voice_idle_timeout_secs: int = 120
    voice_max_sessions: int = 4
    voice_rate_calls: int = 5
    voice_rate_window_secs: int = 600
    voice_daily_user_secs: int = 1800
    voice_tester_user_ids: Annotated[list[str], NoDecode] = Field(default_factory=list)

    # Text chat limits
    chat_rate_messages: int = 30
    chat_rate_window_secs: int = 300

    @field_validator("allowed_origins", "voice_tester_user_ids", mode="before")
    @classmethod
    def _split_csv(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @property
    def is_production(self) -> bool:
        return self.env == "production"

    @property
    def auth_issuer(self) -> str:
        return f"{self.supabase_url.rstrip('/')}/auth/v1"

    @property
    def jwks_url(self) -> str:
        return f"{self.auth_issuer}/.well-known/jwks.json"

    def missing_for(self, role: Role) -> list[str]:
        """Names of required settings that are unset for a process role. Never returns values."""
        required: dict[str, bool] = {
            "SUPABASE_URL": bool(self.supabase_url),
            "DATABASE_URL": bool(self.database_url.get_secret_value()),
            "GEMINI_API_KEY": bool(self.gemini_api_key.get_secret_value()),
        }
        if role in ("api", "worker"):
            required["SUPABASE_SECRET_KEY"] = bool(self.supabase_secret_key.get_secret_value())
        if role in ("api", "voice"):
            required["GROQ_API_KEY"] = bool(self.groq_api_key.get_secret_value())
            required["CARTESIA_API_KEY"] = bool(self.cartesia_api_key.get_secret_value())
        if role == "voice" and self.is_production:
            required["CLOUDFLARE_TURN_KEY_ID"] = bool(self.cloudflare_turn_key_id)
            required["CLOUDFLARE_TURN_API_TOKEN"] = bool(
                self.cloudflare_turn_api_token.get_secret_value()
            )
        return [name for name, present in required.items() if not present]

    def production_errors(self) -> list[str]:
        """Configuration mistakes that must stop a production process from starting."""
        if not self.is_production:
            return []
        errors = [
            f"origin is not https: {origin}"
            for origin in self.allowed_origins
            if not origin.startswith("https://")
        ]
        if not self.supabase_url.startswith("https://"):
            errors.append("SUPABASE_URL is not https")
        return errors


@lru_cache
def get_settings() -> Settings:
    return Settings()
