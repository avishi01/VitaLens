from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "VitaLens API"

    database_url: str

    secret_key: str
    access_token_expire_minutes: int = 60

    # Comma-separated list of allowed frontend origins, e.g.
    # "http://localhost:5173,http://127.0.0.1:5173"
    cors_origins_raw: str = "http://localhost:5173,https://YOUR-VERCEL-URL.vercel.app"

    # Optional: only needed on machines where Tesseract isn't on PATH
    # (e.g. Windows). Leave unset on Linux/Mac if `tesseract` is on PATH.
    tesseract_cmd: str | None = None

    # AI service (Groq)
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-20b"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins_raw.split(",")
            if origin.strip()
        ]


settings = Settings() 