import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.ffmpeg_stream import FFmpegAudioStream
from app.services.deepgram_stt import DeepgramSTTService  # ← changed

router = APIRouter()

FRAME_BYTES = 1024
FRAME_DELAY = 0.032
SILENCE_FRAME = b"\x00" * FRAME_BYTES


@router.websocket("/ws/audio")
async def audio_stream(websocket: WebSocket):
    await websocket.accept()

    decoder = FFmpegAudioStream()
    stt = DeepgramSTTService()  # ← changed
    frame_queue: asyncio.Queue[bytes] = asyncio.Queue()
    stop_sending = asyncio.Event()
    seen_segments: set[str] = set()
    frames_sent = 0
    chunks_received = 0
    bytes_received = 0

    await stt.connect()
    await decoder.start()

    async def forward_transcripts():
        for _ in range(10):
            if stt.client is not None:
                break
            await asyncio.sleep(0.1)

        if stt.client is None:
            print("forward_transcripts: no client, skipping")
            return

        try:
            async for event in stt.events():
                if not event:
                    continue

                # ← new: notify frontend if connection dropped
                if event.get("type") == "connection_closed":
                    await websocket.send_json(
                        {
                            "type": "error",
                            "message": "Transcription service disconnected. Stop and restart recording.",
                        }
                    )
                    return

                segment_id = event.get("segment_id", "")
                text = event.get("text", "").strip()

                if not text or segment_id in seen_segments:
                    continue

                seen_segments.add(segment_id)
                speaker = event.get("speaker", 0)

                print(f"[Speaker {speaker}] {text}")

                await websocket.send_json(
                    {
                        "type": "transcript",
                        "segment_id": segment_id,
                        "text": text,
                        "speaker": speaker,
                        "final": True,
                    }
                )
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
                frame = SILENCE_FRAME

            now = loop.time()
            if next_send > now:
                await asyncio.sleep(next_send - now)

            try:
                await stt.send_audio(frame)
                frames_sent += 1
            except Exception as error:
                print("Deepgram send failed:", type(error).__name__, error)
                print("Attempting Deepgram reconnect...")
                try:
                    await stt.close()
                except Exception:
                    pass
                try:
                    await stt.connect()
                    print("Deepgram reconnected successfully")
                    asyncio.create_task(forward_transcripts())
                    await stt.send_audio(frame)
                except Exception as reconnect_error:
                    print("Reconnect failed:", reconnect_error)
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
        print(f"Frames sent to Deepgram: {frames_sent}")

        transcript = await stt.close()
        await transcript_task

        print("Final transcript:", transcript)

        try:
            await websocket.send_json({"type": "final", "transcript": transcript})
        except Exception:
            pass
