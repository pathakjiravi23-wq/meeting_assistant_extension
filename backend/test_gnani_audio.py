import asyncio
import wave
import os

from dotenv import load_dotenv
from gnani.stt import GnaniSTTStreamClient  # pyright: ignore[reportMissingImports]

load_dotenv()

API_KEY = os.getenv("GNANI_API_KEY")
AUDIO_FILE = "speech_16k.wav"

FRAME_SIZE = 1024
FRAME_DURATION = 0.032
SILENCE_DURATION = 2


async def test_audio_stream():

    # Extract raw PCM audio
    with wave.open(AUDIO_FILE, "rb") as audio:
        pcm_data = audio.readframes(audio.getnframes())

    print("Audio loaded:", len(pcm_data), "bytes")

    # Add 2 seconds of silence to trigger VAD
    silence = b"\x00" * (16000 * 2 * SILENCE_DURATION)
    audio_data = pcm_data + silence

    # Ensure all frames are exactly 1024 bytes
    remainder = len(audio_data) % FRAME_SIZE

    if remainder:
        audio_data += b"\x00" * (FRAME_SIZE - remainder)

    stream = GnaniSTTStreamClient(
        api_key=API_KEY,
        language_code="indic-auto",
        model="prisma-v3.0",
        language_candidates=["hi-IN", "en-IN"],
        sample_rate=16000,
        format="codemix",
    )

    try:
        await stream.connect()
        print("Connected to Gnani!")

        # Send audio at real-time cadence
        for position in range(0, len(audio_data), FRAME_SIZE):

            frame = audio_data[position : position + FRAME_SIZE]

            await stream.send_audio(frame)
            await asyncio.sleep(FRAME_DURATION)

        print("Audio transmission completed!")

        # Close stream and collect transcript events
        transcripts = await stream.close()

        print("\n========== FINAL TRANSCRIPT ==========\n")

        complete_transcript = []

        for event in transcripts:
            complete_transcript.append(event.text)
            print(event.text)

        final_text = " ".join(complete_transcript)

        print("\n========== COMPLETE MEETING TEXT ==========\n")
        print(final_text)

    except Exception as error:
        print("STT error:", error)


if __name__ == "__main__":
    asyncio.run(test_audio_stream())
