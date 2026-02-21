import logging
from pathlib import Path

from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

_DEFAULT_SECRET_KEY = "change-me-in-production"


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://flowboard:flowboard_dev@db:5432/flowboard"
    SECRET_KEY: str = _DEFAULT_SECRET_KEY
    DEBUG: bool = True
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # Database Connection Pool Configuration (E1.6)
    # Optimized for 100+ concurrent users
    DB_POOL_SIZE: int = 20  # Number of connections to maintain
    DB_MAX_OVERFLOW: int = 40  # Additional connections when pool full
    DB_POOL_TIMEOUT: int = 30  # Timeout in seconds for acquiring connection
    DB_POOL_RECYCLE: int = 3600  # Recycle connections after 1 hour
    DB_POOL_PRE_PING: bool = True  # Test connection before use

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()

# Warn if using insecure default secret key outside of DEBUG mode
if settings.SECRET_KEY == _DEFAULT_SECRET_KEY and not settings.DEBUG:
    logger.warning(
        "SECRET_KEY is set to the default insecure value. "
        "Set the SECRET_KEY environment variable before deploying to production."
    )

# Ensure upload directory exists
upload_path = Path(settings.UPLOAD_DIR)
upload_path.mkdir(exist_ok=True)
