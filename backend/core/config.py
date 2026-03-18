import os
import secrets

ENV = os.getenv("ENV", "production")
IS_PROD = ENV == "production"

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    if IS_PROD:
        raise ValueError("SECRET_KEY must be set in production")
    SECRET_KEY = secrets.token_urlsafe(32)
    os.environ["SECRET_KEY"] = SECRET_KEY

CORS_ORIGINS: list[str] = [
    "https://exammath.ru",
    "https://www.exammath.ru",
    "http://localhost:3000",
    "http://192.168.1.83:3000",
]

UPLOAD_DIR = "uploads"
