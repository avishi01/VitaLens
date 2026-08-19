from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "VitaLens API"
    database_url: str = "postgresql://postgres:password@localhost:5432/vitalens"

    class Config:
        env_file = ".env"


settings = Settings() 