from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "VitaLens API"

    database_url: str

    secret_key: str
    access_token_expire_minutes: int = 60

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings() 