import wave
import array


def load(path):
    with wave.open(path, "rb") as w:
        return array.array("h", w.readframes(w.getnframes())), w.getframerate()


ref, rate_ref = load("speech_16k.wav")
dec, rate_dec = load("stream_output.wav")

print("Reference samples:", len(ref), "rate:", rate_ref)
print("Decoded samples:  ", len(dec), "rate:", rate_dec)


def silent_runs(samples, window=1600, threshold=50, min_windows=5):
    runs, start, count = [], None, 0
    for i in range(0, len(samples) - window, window):
        rms = (sum(s * s for s in samples[i : i + window]) / window) ** 0.5
        if rms < threshold:
            if start is None:
                start = i
            count += 1
        else:
            if start is not None and count >= min_windows:
                runs.append((start / 16000, (start + count * window) / 16000))
            start, count = None, 0
    if start is not None and count >= min_windows:
        runs.append((start / 16000, (start + count * window) / 16000))
    return runs


print("\nSilent runs in reference (seconds):", silent_runs(ref))
print("Silent runs in decoded   (seconds):", silent_runs(dec))
