import asyncio
import wave

from app.services.gnani_stt import GnaniSTTService


async def main():
    service = GnaniSTTService()

    with wave.open("speech_16k.wav", "rb") as audio:
        pcm_data = audio.readframes(audio.getnframes())

    await service.connect()

    for position in range(0, len(pcm_data), 1024):
        frame = pcm_data[position : position + 1024]

        if len(frame) < 1024:
            frame += b"\x00" * (1024 - len(frame))

        await service.send_audio(frame)
        await asyncio.sleep(0.032)

    transcript = await service.close()

    print("\nFinal Transcript:")
    print(transcript)


asyncio.run(main())
