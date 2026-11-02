import wave

with wave.open("speech_16k.wav", "rb") as audio:
    print("Channels:", audio.getnchannels())
    print("Sample width:", audio.getsampwidth() * 8, "bits")
    print("Sample rate:", audio.getframerate())
    print("Frames:", audio.getnframes())
    print("Duration:", audio.getnframes() / audio.getframerate(), "seconds")
