import json
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Barber App"
    environment: str = "dev"

    api_host: str = "0.0.0.0"
    api_port: int = 8000

    database_url: str

    jwt_secret: str
    access_token_expires_minutes: int = 1440
    refresh_token_expires_days: int = 30

    # Comma-separated string or JSON array string.
    # Kept as string to avoid pydantic-settings auto JSON decoding errors.
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        v = (self.cors_origins or "").strip()
        if not v:
            return []
        if v.startswith("["):
            parsed = json.loads(v)
            if isinstance(parsed, list):
                return [str(x) for x in parsed]
            return []
        return [item.strip() for item in v.split(",") if item.strip()]

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls,
        init_settings,
        env_settings,
        dotenv_settings,
        file_secret_settings,
    ):
        return (
            init_settings,
            dotenv_settings,
            env_settings,
            file_secret_settings,
        )


settings = Settings()
