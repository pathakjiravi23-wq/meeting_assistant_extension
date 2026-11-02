import os
import asyncio

from dotenv import load_dotenv
from gnani.stt import GnaniSTTStreamClient  # pyright: ignore[reportMissingImports]

load_dotenv()


class GnaniSTTService:

    def __init__(self):
        self.api_key = os.getenv("GNANI_API_KEY")

        if not self.api_key:
            raise ValueError("GNANI_API_KEY not found in .env")

        self.sample_rate = 16000

        self.client = None
        self.transcripts = []

    async def connect(self):

        self.client = GnaniSTTStreamClient(
            api_key=self.api_key,
            language_code="indic-auto",
            model="prisma-v3.0",
            language_candidates=["hi-IN", "en-IN"],
            sample_rate=self.sample_rate,
            format="codemix",
        )

        await self.client.connect()

        print("Connected to Gnani STT")

    async def send_audio(self, pcm_frame):

        if self.client is None:
            raise RuntimeError("Gnani connection is not established")

        await self.client.send_audio(pcm_frame)

    async def close(self):

        if self.client is None:
            return ""

        events = await self.client.close()

        self.transcripts = [event.text for event in events if hasattr(event, "text")]

        self.client = None

        return " ".join(self.transcripts)
