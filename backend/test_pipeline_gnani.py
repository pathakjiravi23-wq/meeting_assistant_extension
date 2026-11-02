import asyncio
import wave

from app.services.ffmpeg_stream import FFmpegAudioStream
from app.services.gnani_stt import GnaniSTTService

CHUNK_SIZE = 4096
CHUNK_DELAY = 0.05
FRAME_DELAY = 0.032


async def main():
    # Decode the WebM file offline through the streaming decoder first.
    with open("test_audio.webm", "rb") as file:
        webm_data = file.read()

    decoder = FFmpegAudioStream()
    await decoder.start()

    for position in range(0, len(webm_data), CHUNK_SIZE):
        await decoder.write(webm_data[position : position + CHUNK_SIZE])
        await asyncio.sleep(CHUNK_DELAY)

    await decoder.close()

    # Feed Gnani from the decoded file, the same way test_stt_service.py does.
    with wave.open("stream_output.wav", "rb") as audio:
        pcm_data = audio.readframes(audio.getnframes())

    stt = GnaniSTTService()
    await stt.connect()

    frames_sent = 0
    for position in range(0, len(pcm_data), 1024):
        frame = pcm_data[position : position + 1024]
        if len(frame) < 1024:
            frame += b"\x00" * (1024 - len(frame))
        await stt.send_audio(frame)
        frames_sent += 1
        await asyncio.sleep(FRAME_DELAY)

    transcript = await stt.close()

    print("Frames sent to Gnani:", frames_sent)
    print("\nFinal Transcript:")
    print(transcript)


if __name__ == "__main__":
    asyncio.run(main())
