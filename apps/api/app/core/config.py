from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Lahasa API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "lahasa-dev-secret-change-in-prod-2024")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:19006",
        "https://*.e2b.app",
        "http://localhost:5173"
    ]
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./lahasa.db")
    
    # Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # OCR
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "/usr/bin/tesseract")
    OCR_ENGINE: str = os.getenv("OCR_ENGINE", "auto")  # auto, tesseract, mock
    ENABLE_ENCRYPTION: bool = False
    
    # QR
    QR_SECRET: str = os.getenv("QR_SECRET", "lahasa-qr-secret")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
