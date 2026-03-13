import os


ENV = os.getenv("ENV", "production")
IS_PROD = ENV == "production"

CORS_ORIGINS: list[str] = [
    "https://exammath.ru",
    "https://www.exammath.ru",
    "http://localhost:3000",
    "http://192.168.1.83:3000",
]

UPLOAD_DIR = "uploads"
