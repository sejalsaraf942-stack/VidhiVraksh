import os
from pydantic import BaseModel
from typing import List

class Settings(BaseModel):
    APP_NAME: str = "VIDHIVRAKSH - Legal Awareness Assistant"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    API_PREFIX: str = "/api/v1"
    
    # Server-only secrets: MUST NEVER be sent to client
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-insecure-secret-key-vidhivraksh-hackathon-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./libra.db")
    
    # Allowed CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]

settings = Settings()

def get_public_config() -> dict:
    """Returns only safe, non-sensitive configuration keys suitable for client/public display."""
    return {
        "app_name": settings.APP_NAME,
        "app_version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }
