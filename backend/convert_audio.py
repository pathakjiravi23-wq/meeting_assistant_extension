import wave
import numpy as np  # pyright: ignore[reportMissingImports]
from scipy.signal import resample_poly  # pyright: ignore[reportMissingImports]
from math import gcd

with wave.open("speech.wav", "rb") as source:

    sample_rate = source.getframerate()
    channels = source.getnchannels()

    audio_data = source.readframes(source.getnframes())

    # Convert bytes into signed 16-bit samples
    audio = np.frombuffer(audio_data, dtype=np.int16)

    # Resample 22050 Hz to 16000 Hz
    common = gcd(sample_rate, 16000)

    converted = resample_poly(audio, 16000 // common, sample_rate // common)

    converted = np.clip(converted, -32768, 32767).astype(np.int16)

    with wave.open("speech_16k.wav", "wb") as output:
        output.setnchannels(channels)
        output.setsampwidth(2)
        output.setframerate(16000)
        output.writeframes(converted.tobytes())

print("Conversion completed!")
