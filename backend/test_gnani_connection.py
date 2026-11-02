import asyncio
import os

from dotenv import load_dotenv
from gnani.stt import GnaniSTTStreamClient  # pyright: ignore[reportMissingImports]

load_dotenv()

GNANI_API_KEY = os.getenv("GNANI_API_KEY")


async def test_connection():

    if not GNANI_API_KEY:
        raise ValueError("GNANI_API_KEY not found in .env")

    async with GnaniSTTStreamClient(
        api_key=GNANI_API_KEY,
        language_code="indic-auto",
        model="prisma-v3.0",
        language_candidates=["hi-IN", "en-IN"],
        sample_rate=16000,
        format="codemix",
    ) as stream:

        print("Gnani WebSocket connected!")
        print("Server configuration:")
        print(stream.connected_config)


if __name__ == "__main__":
    asyncio.run(test_connection())
