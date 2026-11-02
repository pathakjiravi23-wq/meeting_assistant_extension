import wave
import numpy as np  # pyright: ignore[reportMissingImports]

sample_rate = 16000
duration = 5

# Generate a 440 Hz test tone
t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)

audio = 0.3 * np.sin(2 * np.pi * 440 * t)

# Convert float audio to signed 16-bit PCM
pcm_audio = (audio * 32767).astype(np.int16)

with wave.open("test_audio.wav", "wb") as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)
    wav.setframerate(sample_rate)
    wav.writeframes(pcm_audio.tobytes())

print("Test audio generated successfully!")
