"""App settings, read from environment variables and the repo-root .env file."""

import json
from pathlib import Path
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=REPO_ROOT / ".env", extra="ignore")

    database_url: str = "postgresql://lamp:lamp@localhost:5432/lamp"
    # Secret for the duplicate-financing registry. Required unless DEV_MODE is on.
    registry_key: str = ""
    # Demo controls (/dev/reset, the supplier-reply simulator) exist only when this is true.
    dev_mode: bool = False
    # Shared demo (judge link): reset loads the three confirmed demo captures too, and with
    # DEMO_AUTO_RESET_MINUTES > 0 (and DEV_MODE) the demo resets itself on that interval.
    demo_reset_with_captures: bool = False
    demo_auto_reset_minutes: int = 0
    llm_mode: str = "replay"
    openai_api_key: str = ""
    openai_extract_model: str = "gpt-6-luna"
    llm_daily_budget_usd: float = 1.00  # 0 means no daily limit
    # A JSON list (["https://a", "https://b"]), a comma-separated list, or one address.
    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:3000"]
    # Crash alerts by email (engines/mailer.py). Any of the first three empty: no email is sent.
    brevo_api_key: str = ""
    alert_email_to: str = ""       # comma-separated
    alert_email_from: str = ""     # a verified sender in the Brevo account
    alert_cooldown_minutes: int = 10

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _origins(cls, v):
        if not isinstance(v, str):
            return v
        v = v.strip()
        if v.startswith("["):
            return json.loads(v)
        return [o.strip().strip('"').rstrip("/") for o in v.split(",") if o.strip()]


DEV_REGISTRY_KEY = "dev-only-registry-key"
PLACEHOLDER_KEYS = {"", "change-me", "dev-registry-key-change-me"}


def registry_secret() -> str:
    """The registry HMAC key. Outside DEV_MODE a real key must be configured."""
    if settings.registry_key not in PLACEHOLDER_KEYS:
        return settings.registry_key
    if settings.dev_mode:
        return DEV_REGISTRY_KEY
    raise RuntimeError("REGISTRY_KEY is not set. Set it in .env (any long random string), or run with DEV_MODE=true.")


settings = Settings()
