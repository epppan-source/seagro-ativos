from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://seagro:senha@localhost:5432/seagro_ativos"

    SECRET_KEY: str = "TROQUE_POR_CHAVE_SEGURA_256_BITS"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    APP_NAME: str = "SEAGRO Ativos"
    APP_URL: str = "https://ativos.seagro.com.br"
    DEBUG: bool = False

    ALLOWED_ORIGINS: list[str] = [
        "https://ativos.seagro.com.br",
        "http://ativos.seagro.com.br",
        "http://localhost:3000",
    ]

    EMAIL_PROVIDER: str = "smtp"
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "ativos@seagro.com.br"
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "SEAGRO Ativos <ativos@seagro.com.br>"

    RESEND_API_KEY: Optional[str] = None

    UPLOAD_DIR: str = "./static/uploads"
    MAX_FILE_SIZE_MB: int = 10

    GESTOR_EMAIL: str = "pancini@seagro.com.br"

    class Config:
        env_file = ".env"

settings = Settings()
