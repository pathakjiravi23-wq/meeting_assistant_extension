import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    DEEPGRAM_API_KEY: str = os.getenv("DEEPGRAM_API_KEY", "")


settings = Settings()

if not settings.DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env")
