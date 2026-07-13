from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import secrets


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────
    APP_NAME: str = "JCAS API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    # ── Database ─────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql://jcas_user:jcas_secret@localhost:5432/jcas_db"

    # ── Security ─────────────────────────────────────────────────────────
    SECRET_KEY: str = secrets.token_hex(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ── File Storage ─────────────────────────────────────────────────────
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_FILE_TYPES: str = "pdf,docx,zip"

    @property
    def allowed_extensions(self) -> List[str]:
        return [f".{e.strip()}" for e in self.ALLOWED_FILE_TYPES.split(",")]

    # ── Email ─────────────────────────────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "noreply@jcas.edu"
    EMAILS_FROM_NAME: str = "JCAS Editorial System"
    EMAILS_ENABLED: bool = False

    # ── AWS S3 ────────────────────────────────────────────────────────────
    USE_S3: bool = False
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "jcas-manuscripts"
    AWS_REGION: str = "us-east-1"

    # ── First Admin ───────────────────────────────────────────────────────
    FIRST_ADMIN_EMAIL: str = "admin@jcas.edu"
    FIRST_ADMIN_PASSWORD: str = "Admin@jcas2024"
    FIRST_ADMIN_NAME: str = "System Administrator"

    # ── First Editor-in-Chief ─────────────────────────────────────────────
    FIRST_EIC_EMAIL: str = "eic@jcas.edu"
    FIRST_EIC_PASSWORD: str = "EditorChief@2024"
    FIRST_EIC_NAME: str = "Editor in Chief"


settings = Settings()
