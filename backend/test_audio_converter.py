import asyncio
import wave

from app.services.audio_converter import convert_webm_to_pcm


async def main():
    # Read the existing WebM test audio file
    with open("test_audio.webm", "rb") as file:
        webm_data = file.read()

    pcm_data = await convert_webm_to_pcm(webm_data)

    print("WebM size:", len(webm_data), "bytes")
    print("PCM size:", len(pcm_data), "bytes")

    # Save converted PCM as WAV for verification
    with wave.open("converted_audio.wav", "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(16000)
        output.writeframes(pcm_data)

    print("Conversion successful!")


asyncio.run(main())
