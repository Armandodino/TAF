#!/usr/bin/env python3
"""
Synthetise la voix off et ecrit le minutage que le montage suivra.

Le film se cale sur la voix, pas l'inverse : chaque replique est synthetisee
a part, sa duree reelle est mesuree, et c'est elle qui fixe la duree du plan
correspondant. Un montage ecrit d'abord puis double ensuite ne tombe jamais
juste.

Sortie :
  animation/public/audio/voix.wav   la bande complete, silences compris
  animation/src/ad/script.ts        le minutage, en images

Usage: python3 tools/build_voiceover.py
"""
import json
import os
import wave

import numpy as np
from piper import PiperVoice, SynthesisConfig

MODEL = "voice/fr-siwis-medium.onnx"
OUT_WAV = "animation/public/audio/voix.wav"
OUT_TS = "animation/src/ad/script.ts"
#: Meme minutage, lisible par les outils : le TypeScript est pour le montage,
#: ce JSON pour la bande-son. Relire le TS a la regex serait fragile.
OUT_JSON = "animation/public/audio/script.json"
FPS = 30

#: Debit : au-dessus de 1, la locutrice ralentit. Une voix off de marque
#: pose ses phrases, elle ne lit pas un communique.
LENGTH_SCALE = 1.06

#: (identifiant de plan, texte dit, silence apres la replique en secondes)
SCRIPT = [
    ("ouverture",  "Certaines marques naissent d'une idée.", 0.55),
    ("origine",    "AYOKA, elle, naît d'une histoire.", 0.7),
    ("ivoirienne", "Une histoire profondément ivoirienne.", 0.5),
    ("bete",       "AYOKA, un nom inspiré du peuple bété,", 0.15),
    ("racines",    "porte en lui nos racines, notre culture, notre identité.", 0.7),
    ("elephant",   "Puis vient l'éléphant.", 0.5),
    ("symbole",    "Symbole emblématique de la Côte d'Ivoire, il représente la force, "
                   "la prestance, et cette empreinte que l'on laisse derrière soi.", 0.7),
    ("reunir",     "Alors, nous avons réuni les deux.", 0.5),
    ("mot",        "Un mot.", 0.35),
    ("signe",      "Un symbole.", 0.35),
    ("identite",   "Une identité.", 0.5),
    ("naissance",  "Et de cette rencontre est né AYOKA.", 0.8),
    ("marque",     "Une marque de vêtements qui transforme notre héritage "
                   "en une nouvelle façon de s'exprimer.", 0.6),
    ("pieces",     "Des pièces que l'on porte.", 0.35),
    ("affirme",    "Une identité que l'on affirme.", 0.6),
    ("passe",      "Parce que notre culture n'appartient pas seulement au passé.", 0.45),
    ("evolue",     "Elle évolue. Elle se réinvente. Elle se porte.", 0.6),
    ("rencontre",  "AYOKA, c'est la rencontre entre nos racines et notre époque.", 0.6),
    ("surnous",    "Notre histoire sur nous.", 0.35),
    ("mouvement",  "Notre identité, en mouvement.", 0.8),
    ("signature",  "AYOKA. Porte ton histoire.", 1.4),
]


def synthesize(voice, text, config):
    chunks = list(voice.synthesize(text, config))
    audio = np.concatenate([
        np.frombuffer(c.audio_int16_bytes, dtype=np.int16) for c in chunks
    ])
    return audio, chunks[0].sample_rate


def main():
    voice = PiperVoice.load(MODEL)
    config = SynthesisConfig(length_scale=LENGTH_SCALE, normalize_audio=True)

    rate = None
    track = []
    marks = []
    cursor = 0.0

    for key, text, gap in SCRIPT:
        audio, rate = synthesize(voice, text, config)
        start = cursor
        track.append(audio)
        cursor += len(audio) / rate
        spoken = cursor - start
        track.append(np.zeros(int(gap * rate), np.int16))
        cursor += gap
        marks.append({
            "key": key,
            "text": text,
            "start": round(start, 3),
            "spoken": round(spoken, 3),
            "end": round(cursor, 3),
        })
        print(f"  {key:11s} {spoken:5.2f}s + {gap:.2f}s  →  {cursor:6.2f}s")

    # une respiration avant la premiere phrase : la voix ne doit pas tomber
    # sur la toute premiere image
    lead = np.zeros(int(1.1 * rate), np.int16)
    full = np.concatenate([lead] + track)
    for m in marks:
        m["start"] = round(m["start"] + 1.1, 3)
        m["end"] = round(m["end"] + 1.1, 3)
        m["frame"] = round(m["start"] * FPS)
        m["frames"] = round((m["end"] - m["start"]) * FPS)

    os.makedirs(os.path.dirname(OUT_WAV), exist_ok=True)
    with wave.open(OUT_WAV, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(full.tobytes())

    duration = len(full) / rate
    total_frames = int(np.ceil(duration * FPS))
    lines = [
        "// Genere par tools/build_voiceover.py — ne pas editer a la main.",
        "// Le minutage vient de la voix reellement synthetisee : chaque plan",
        "// dure exactement le temps de sa replique.",
        "",
        f"export const VOICE_FILE = 'audio/voix.wav';",
        f"export const VOICE_FRAMES = {total_frames};",
        "",
        "export type Line = {",
        "  key: string;",
        "  text: string;",
        "  /** Image de depart de la replique. */",
        "  frame: number;",
        "  /** Duree de la replique, silence de fin compris. */",
        "  frames: number;",
        "};",
        "",
        "export const SCRIPT: readonly Line[] = [",
    ]
    for m in marks:
        lines.append("  " + json.dumps(
            {"key": m["key"], "text": m["text"],
             "frame": m["frame"], "frames": m["frames"]},
            ensure_ascii=False) + ",")
    lines += [
        "];",
        "",
        "/** Replique par identifiant. */",
        "export const line = (key: string): Line => {",
        "  const found = SCRIPT.find((l) => l.key === key);",
        "  if (!found) throw new Error(`replique inconnue : ${key}`);",
        "  return found;",
        "};",
        "",
    ]
    open(OUT_TS, "w").write("\n".join(lines))
    json.dump(
        {"fps": FPS, "duration": round(duration, 3), "frames": total_frames,
         "lines": [{"key": m["key"], "frame": m["frame"], "frames": m["frames"],
                    "start": m["start"], "end": m["end"]} for m in marks]},
        open(OUT_JSON, "w"), ensure_ascii=False, indent=1)
    print(f"\n{OUT_WAV} — {duration:.2f}s ({total_frames} images à {FPS} i/s)")
    print(f"{OUT_TS} — {len(marks)} repliques")


if __name__ == "__main__":
    main()
