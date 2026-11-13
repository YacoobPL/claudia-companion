"""Claudia's short sounds, synthesised here (soft sines with a bell-like decay), so they are her own.

    python claudia_sounds.py

writes assets/needyou.wav (two rising tones: "hey?", I need you) and assets/oops.wav (one low, soft tone:
something went wrong). The turn's end keeps assets/jingle.wav. Mono, 16-bit, 22050 Hz, like the jingle.
"""
import math
import struct
import wave

RATE = 22050


def tone(freq, seconds, volume=0.35, attack=0.008, decay=6.0, partials=((1, 1.0), (2, 0.25), (3, 0.08))):
    """A soft bell: a quick attack, an exponential fade, a few quiet overtones."""
    n = int(RATE * seconds)
    out = []
    for i in range(n):
        t = i / RATE
        env = min(1.0, t / attack) * math.exp(-decay * t)
        s = sum(a * math.sin(2 * math.pi * freq * k * t) for k, a in partials)
        out.append(volume * env * s / sum(a for _, a in partials))
    return out


def mix(*parts):
    """Lay parts over each other: (offset in seconds, samples)."""
    length = max(int(off * RATE) + len(p) for off, p in parts)
    out = [0.0] * length
    for off, p in parts:
        start = int(off * RATE)
        for i, v in enumerate(p):
            out[start + i] += v
    return out


def save(path, samples):
    # a short fade at the very end, so nothing clicks
    tail = int(0.02 * RATE)
    for i in range(tail):
        samples[-1 - i] *= i / tail
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1.0, min(1.0, v)) * 32767)) for v in samples))


if __name__ == "__main__":
    # "hey?": E5 then A5, a rising fourth, the second a little longer
    save("assets/needyou.wav", mix((0.0, tone(659.25, 0.22, decay=9)), (0.14, tone(880.0, 0.36, decay=7))))
    # "uh-oh", softly: one low tone sliding a touch down, quiet and short
    low = tone(220.0, 0.45, volume=0.3, decay=6, partials=((1, 1.0), (2, 0.15)))
    under = tone(207.65, 0.45, volume=0.12, decay=6, partials=((1, 1.0),))
    save("assets/oops.wav", mix((0.0, low), (0.05, under)))
    print("ok")
