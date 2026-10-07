import os
from dataclasses import dataclass, field


def _origins() -> list[str]:
    value = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    return [origin.strip() for origin in value.split(",") if origin.strip()]


@dataclass(frozen=True)
class Settings:
    app_env: str = field(default_factory=lambda: os.getenv("APP_ENV", "development"))
    database_url: str = field(
        default_factory=lambda: os.getenv("DATABASE_URL", "sqlite:///./trackflow.db")
    )
    allowed_origins: list[str] = field(default_factory=_origins)


settings = Settings()