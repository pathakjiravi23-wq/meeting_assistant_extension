import asyncio
import wave

from app.services.ffmpeg_stream import FFmpegAudioStream

CHUNK_SIZE = 4096  # simulates MediaRecorder timeslice data
CHUNK_DELAY = 0.05  # seconds between writes
EXPECTED_BYTES = 354970
TOLERANCE = 4096  # allow for one frame of padding and codec priming


async def main():
    with open("test_audio.webm", "rb") as file:
        webm_data = file.read()

    stream = FFmpegAudioStream()
    await stream.start()

    received_frames = 0
    received_before_close = 0
    closed = False

    async def consume():
        nonlocal received_frames, received_before_close
        async for frame in stream.frames():
            assert len(frame) == 1024, f"bad frame size: {len(frame)}"
            received_frames += 1
            if not closed:
                received_before_close += 1

    consumer = asyncio.create_task(consume())

    for position in range(0, len(webm_data), CHUNK_SIZE):
        await stream.write(webm_data[position : position + CHUNK_SIZE])
        await asyncio.sleep(CHUNK_DELAY)

    closed = True
    await stream.close()
    await consumer

    pcm_data = bytes(stream.output_buffer)

    print("WebM input:", len(webm_data), "bytes")
    print("PCM output:", len(pcm_data), "bytes")
    print("Frames emitted:", received_frames)
    print("Frames received before close():", received_before_close)

    with wave.open("stream_output.wav", "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(16000)
        output.writeframes(pcm_data)

    if abs(len(pcm_data) - EXPECTED_BYTES) <= TOLERANCE and received_before_close > 0:
        print("PASS: incremental decoding works")
    else:
        print("FAIL: check output size and whether frames arrived before close()")


if __name__ == "__main__":
    asyncio.run(main())
