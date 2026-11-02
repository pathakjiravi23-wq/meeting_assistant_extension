import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from gnani.stt import StreamTranscriptEvent  # pyright: ignore[reportMissingImports]

from app.services.ffmpeg_stream import FFmpegAudioStream
from app.services.gnani_stt import GnaniSTTService

router = APIRouter()

FRAME_BYTES = 1024
FRAME_DELAY = 0.032  # 1024 bytes = 32 ms at 16 kHz, 16-bit mono
SILENCE_FRAME = b"\x00" * FRAME_BYTES


@router.websocket("/ws/audio")
async def audio_stream(websocket: WebSocket):
    await websocket.accept()

    decoder = FFmpegAudioStream()
    stt = GnaniSTTService()
    frame_queue: asyncio.Queue[bytes] = asyncio.Queue()
    stop_sending = asyncio.Event()
    seen_segments: set[str] = set()
    frames_sent = 0
    chunks_received = 0
    bytes_received = 0

    await stt.connect()
    await decoder.start()

    async def forward_transcripts():
        assert stt.client is not None
        try:
            async for event in stt.client.events():
                if not isinstance(event, StreamTranscriptEvent):
                    continue
                text = event.text.strip()
                if not text or event.segment_id in seen_segments:
                    continue
                seen_segments.add(event.segment_id)
                await websocket.send_json({
                    "type": "transcript",
                    "segment_id": event.segment_id,
                    "text": text,
                    "final": True,
                })
        except Exception as error:
            print("Transcript forwarding stopped:", error)

    async def read_decoded_frames():
        async for frame in decoder.frames():
            await frame_queue.put(frame)

    async def send_paced_frames():
        nonlocal frames_sent
        loop = asyncio.get_running_loop()
        next_send = loop.time()

        while True:
            if stop_sending.is_set() and frame_queue.empty():
                return

            try:
                frame = await asyncio.wait_for(frame_queue.get(), timeout=FRAME_DELAY)
            except asyncio.TimeoutError:
                frame = SILENCE_FRAME  # keep Gnani's stream continuous

            now = loop.time()
            if next_send > now:
                await asyncio.sleep(next_send - now)

            try:
                await stt.send_audio(frame)
                frames_sent += 1
            except Exception as error:
                print("Gnani send failed:", type(error).__name__, error)
                return

            next_send = max(next_send, now) + FRAME_DELAY

    transcript_task = asyncio.create_task(forward_transcripts())
    reader_task = asyncio.create_task(read_decoded_frames())
    sender_task = asyncio.create_task(send_paced_frames())

    try:
        while True:
            chunk = await websocket.receive_bytes()
            chunks_received += 1
            bytes_received += len(chunk)
            await decoder.write(chunk)

    except WebSocketDisconnect:
        print("extension disconnected")

    finally:
        print(f"Chunks received: {chunks_received}, bytes: {bytes_received}")

        try:
            await decoder.close()
        except Exception as error:
            print("Decoder close failed:", error)

        await reader_task
        stop_sending.set()
        await sender_task
        print(f"Frames sent to Gnani: {frames_sent}")

        transcript = await stt.close()
        await transcript_task

        print("Final transcript:", transcript)

        try:
            await websocket.send_json({"type": "final", "transcript": transcript})
        except Exception:
            pass  # socket already closed