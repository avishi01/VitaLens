from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "VitaLens API"

    database_url: str

    secret_key: str
    access_token_expire_minutes: int = 60

    # Comma-separated list of allowed frontend origins, e.g.
    # "http://localhost:5173,http://127.0.0.1:5173"
    cors_origins_raw: str = "http://localhost:5173"

    # Optional: only needed on machines where Tesseract isn't on PATH
    # (e.g. Windows). Leave unset on Linux/Mac if `tesseract` is on PATH.
    tesseract_cmd: str | None = None

    # Local AI (Group 4)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen3:8b"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins_raw.split(",")
            if origin.strip()
        ]


settings = Settings() 