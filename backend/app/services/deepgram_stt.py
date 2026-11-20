import os
import asyncio
from typing import Optional

from dotenv import load_dotenv
from deepgram import AsyncDeepgramClient
from deepgram.core.events import EventType

load_dotenv()


class DeepgramSTTService:
    """
    Drop-in replacement for GnaniSTTService — SDK v7.19 compatible.
    Interface: connect(), send_audio(), events(), close(), client
    """

    def __init__(self):
        self.api_key: str = os.getenv("DEEPGRAM_API_KEY") or ""
        if not self.api_key:
            raise ValueError("DEEPGRAM_API_KEY not found in .env")

        self.sample_rate = 16000
        self.client = None
        self._dg_client: Optional[AsyncDeepgramClient] = None
        self._connection = None
        self._ctx_manager = None
        self._transcripts: list[str] = []
        self._seen_segments: set[str] = set()
        self._event_queue: asyncio.Queue = asyncio.Queue()
        self._listen_task: Optional[asyncio.Task] = None

    async def connect(self):
        self._transcripts = []
        self._event_queue = asyncio.Queue()

        # v7.19: set env var first, then init with no args
        os.environ["DEEPGRAM_API_KEY"] = self.api_key
        self._dg_client = AsyncDeepgramClient()

        # v7.19: listen.v1.connect() is an async context manager
        self._ctx_manager = self._dg_client.listen.v1.connect(
            model="nova-2",
            language="hi",
            smart_format=True,
            punctuate=True,
            diarize=True,
            utterance_end_ms="1000",
            vad_events=True,
            interim_results=True,
            encoding="linear16",
            sample_rate=self.sample_rate,
            channels=1,
        )

        # Enter the context manager to get the actual connection object
        self._connection = await self._ctx_manager.__aenter__()

        # Register event handlers on the real connection object
        self._connection.on(EventType.MESSAGE, self._on_message)
        self._connection.on(EventType.ERROR, self._on_error)
        self._connection.on(EventType.CLOSE, self._on_close)

        # Start listening in background task — keeps connection alive
        self._listen_task = asyncio.create_task(self._connection.start_listening())

        self.client = self  # signals websocket.py that we're ready
        print("Connected to Deepgram STT (nova-2, diarize, hi/en)")

    def _on_message(self, result):
        asyncio.get_event_loop().call_soon_threadsafe(
            lambda: asyncio.ensure_future(self._handle_transcript(result))
        )

    def _on_error(self, error):
        print("Deepgram error:", error)

    def _on_close(self, close):
        print("Deepgram connection closed")
        asyncio.get_event_loop().call_soon_threadsafe(
            lambda: asyncio.ensure_future(
                self._event_queue.put(
                    {
                        "type": "connection_closed",
                        "text": "Connection to transcription service closed.",
                    }
                )
            )
        )
        # Also put None to stop the events() generator
        asyncio.get_event_loop().call_soon_threadsafe(
            lambda: asyncio.ensure_future(self._event_queue.put(None))
        )

    async def _handle_transcript(self, result):
        try:
            if result.type != "Results":
                return

            alt = result.channel.alternatives[0]
            text = alt.transcript.strip()
            if not text or not result.is_final:
                return

            segment_id = str(result.start)
            if segment_id in self._seen_segments:
                return
            self._seen_segments.add(segment_id)

            # Extract speaker from diarization if available
            speaker_id = 0
            if alt.words:
                speaker_id = getattr(alt.words[0], "speaker", 0) or 0

            self._transcripts.append(text)
            print(f"[Speaker {speaker_id}] {text}")

            await self._event_queue.put(
                {
                    "type": "transcript",
                    "segment_id": segment_id,
                    "text": text,
                    "speaker": speaker_id,
                    "final": True,
                }
            )

        except Exception as e:
            print("_handle_transcript error:", e)

    async def send_audio(self, pcm_frame: bytes):
        if self._connection is None:
            raise RuntimeError("Deepgram connection not established")
        await self._connection.send_media(pcm_frame)

    async def events(self):
        """
        Async generator — yields transcript dicts until stream closes.
        Called by forward_transcripts() in websocket.py.
        """
        while True:
            item = await self._event_queue.get()
            if item is None:
                return
            yield item

    async def close(self) -> str:
        if self._connection is None:
            return " ".join(self._transcripts)

        try:
            if self._ctx_manager is not None:
                await self._ctx_manager.__aexit__(None, None, None)
        except Exception as e:
            print("Deepgram close error:", e)

        if self._listen_task:
            self._listen_task.cancel()
            try:
                await self._listen_task
            except asyncio.CancelledError:
                pass

        self._connection = None
        self._ctx_manager = None
        self.client = None

        return " ".join(self._transcripts)
