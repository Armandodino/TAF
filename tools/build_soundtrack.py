#!/usr/bin/env python3
"""
Construit la bande-son : voix off, effets et nappe, mixes en une piste.

Les reperes viennent du minutage de la voix, donc les effets tombent sur les
memes images que les raccords du montage. Tout est synthetise ici : le
conteneur n'a pas de banque de sons, et des effets calcules se placent de
toute facon plus juste que des fichiers tires d'une bibliotheque.

Usage: python3 tools/build_soundtrack.py
"""
import json
import wave

import numpy as np

VOICE = "animation/public/audio/voix.wav"
SCRIPT_JSON = "animation/public/audio/script.json"
OUT = "animation/public/audio/bande-son.wav"
RATE = 44100

#: Repliques ou le film frappe fort : l'assemblage du logo et la signature.
STRIKES = {"naissance", "signature"}
#: Repliques scandees, qui appellent un clic sec plutot qu'un souffle.
TICKS = {"mot", "signe", "identite", "pieces", "surnous"}


def read_wav(path):
    with wave.open(path, "rb") as w:
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
        return data.astype(np.float32) / 32768.0, w.getframerate()


def resample(x, src, dst):
    if src == dst:
        return x
    n = int(len(x) * dst / src)
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x)


def envelope(n, attack, decay, curve=2.0):
    """Enveloppe attaque/chute, en secondes."""
    a = max(1, int(attack * RATE))
    d = max(1, n - a)
    return np.concatenate([
        np.linspace(0, 1, a) ** 0.5,
        (np.linspace(1, 0, d) ** curve),
    ])[:n]


def noise_sweep(dur, f0, f1, attack=0.004, curve=2.5):
    """Souffle : bruit dont le centre glisse d'une frequence a l'autre."""
    n = int(dur * RATE)
    x = np.random.default_rng(7).standard_normal(n)
    # filtre passe-bande glissant, applique par modulation en anneau
    t = np.arange(n) / RATE
    sweep = np.linspace(f0, f1, n)
    phase = 2 * np.pi * np.cumsum(sweep) / RATE
    band = x * np.sin(phase)
    # lissage : une moyenne glissante coupe le haut du spectre
    k = 24
    band = np.convolve(band, np.ones(k) / k, mode="same")
    return band * envelope(n, attack, dur, curve)


def click(dur=0.09, freq=2400):
    n = int(dur * RATE)
    t = np.arange(n) / RATE
    tone = np.sin(2 * np.pi * freq * t) * np.exp(-t * 90)
    snap = np.random.default_rng(3).standard_normal(n) * np.exp(-t * 180)
    return (tone * 0.5 + snap * 0.5) * envelope(n, 0.001, dur, 3.0)


def impact(dur=1.5):
    """Choc : une basse qui descend, un corps median, un souffle d'air."""
    n = int(dur * RATE)
    t = np.arange(n) / RATE
    pitch = 120 * np.exp(-t * 7) + 38
    body = np.sin(2 * np.pi * np.cumsum(pitch) / RATE)
    crack = np.random.default_rng(11).standard_normal(n) * np.exp(-t * 26)
    air = noise_sweep(dur, 5200, 240, attack=0.002, curve=1.6)
    mix = body * 0.85 * np.exp(-t * 2.4) + crack * 0.22 + air * 0.3
    return mix * envelope(n, 0.002, dur, 1.2)


def riser(dur=2.0):
    """Montee de tension : bruit et sinus qui grimpent ensemble."""
    n = int(dur * RATE)
    t = np.arange(n) / RATE
    ramp = (t / dur) ** 1.8
    tone = np.sin(2 * np.pi * np.cumsum(180 + ramp * 900) / RATE)
    hiss = noise_sweep(dur, 400, 7000, attack=0.4, curve=0.6)
    return (tone * 0.32 + hiss * 0.5) * ramp


def drone(dur, root=55.0):
    """
    Nappe tenue, sous la voix.

    Un accord mineur tres grave, module lentement : il tient le film ensemble
    sans jamais disputer l'attention a la parole.
    """
    n = int(dur * RATE)
    t = np.arange(n) / RATE
    out = np.zeros(n)
    # fondamentale, quinte, tierce mineure a l'octave
    for mult, gain in ((1.0, 0.5), (1.5, 0.22), (2.4, 0.13), (4.0, 0.06)):
        wobble = 1 + 0.0016 * np.sin(2 * np.pi * (0.07 + mult * 0.011) * t)
        out += gain * np.sin(2 * np.pi * root * mult * t * wobble)
    swell = 0.55 + 0.45 * np.sin(2 * np.pi * t / 19.0 - np.pi / 2)
    return out * swell * 0.5


def place(track, sound, at, gain=1.0):
    i = int(at * RATE)
    n = min(len(sound), len(track) - i)
    if n > 0:
        track[i:i + n] += sound[:n] * gain


def load_script():
    return json.load(open(SCRIPT_JSON, encoding="utf-8"))["lines"]


def main():
    voice, vrate = read_wav(VOICE)
    voice = resample(voice, vrate, RATE)
    total = len(voice) + int(1.2 * RATE)
    lines = load_script()

    fx = np.zeros(total)
    bed = drone(total / RATE)[:total]

    for i, ln in enumerate(lines):
        at = ln["frame"] / 30.0
        key = ln["key"]
        if key in STRIKES:
            place(fx, riser(1.9), max(0, at - 1.9), 0.5)
            place(fx, impact(1.7), at - 0.07, 0.95)
        elif key in TICKS:
            place(fx, click(), at - 0.05, 0.5)
        else:
            # souffle de raccord, alterne pour ne pas s'entendre deux fois pareil
            up = i % 2 == 0
            place(fx, noise_sweep(0.5, 260 if up else 5200,
                                  5200 if up else 260), at - 0.34, 0.26)

    # la voix commande : la musique et les effets s'ecartent sous elle
    speech = np.abs(voice)
    k = int(0.09 * RATE)
    speech = np.convolve(speech, np.ones(k) / k, mode="same")
    speech = speech[:total] if len(speech) >= total else np.pad(
        speech, (0, total - len(speech)))
    duck = 1.0 - 0.62 * np.clip(speech / 0.16, 0, 1)

    mix = np.zeros(total)
    mix[:len(voice)] += voice * 0.94
    mix += bed * duck * 0.3
    mix += fx * (0.45 + 0.55 * duck)

    peak = np.max(np.abs(mix))
    mix = mix / peak * 0.92
    # limiteur doux : arrondit les cretes au lieu de les ecreter
    mix = np.tanh(mix * 1.12) / np.tanh(1.12)

    with wave.open(OUT, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    print(f"{OUT} — {total / RATE:.2f}s, {len(lines)} reperes, "
          f"crete {np.max(np.abs(mix)):.2f}")


if __name__ == "__main__":
    main()
