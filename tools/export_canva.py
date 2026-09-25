#!/usr/bin/env python3
"""
Prepare les calques pour Canva.

Canva aplatit les SVG a l'import : ce sont les PNG separes qui servent de calques.
Tous les fichiers gardent la toile 1600 x 1600, donc poses en pleine page ils
s'alignent sans reglage. Les noms sont numerotes dans l'ordre d'animation, pour
que la bibliotheque Canva les affiche deja dans le bon ordre.

Deux jeux :
  lettres/   les 5 lettres separees + trompe + defenses  (8 calques)
  anatomie/  oreilles regroupees                         (6 calques)
chacun en noir (fond clair) et en blanc (fond sombre).

Usage: python3 tools/export_canva.py
"""
import os
import shutil

import numpy as np
from PIL import Image

SRC = "export/png"
OUT = "export/canva"

LETTRES = [
    ("0-logo-complet", ["_complet"]),
    ("1-lettre-A", ["A1"]),
    ("2-lettre-Y", ["Y"]),
    ("3-lettre-O", ["O"]),
    ("4-lettre-K", ["K"]),
    ("5-lettre-A", ["A2"]),
    ("6-trompe", ["trunk"]),
    ("7-defense-gauche", ["tusk_L"]),
    ("8-defense-droite", ["tusk_R"]),
]
ANATOMIE = [
    ("0-logo-complet", ["_complet"]),
    ("1-oreille-gauche", ["A1", "Y"]),
    ("2-oreille-droite", ["K", "A2"]),
    ("3-crane", ["O"]),
    ("4-trompe", ["trunk"]),
    ("5-defense-gauche", ["tusk_L"]),
    ("6-defense-droite", ["tusk_R"]),
]
PLIS = [("trompe-pleine", ["trunk_solid"])] + \
       [(f"pli-{i}", [f"fold_{i}"]) for i in (1, 2, 3, 4)]


def square_crop(margin=0.08):
    """Carre centre sur le logo : pose en pleine page, il remplit le cadre au lieu
    de flotter dans le vide de la toile d'origine. Tous les calques sont recadres
    a l'identique, donc ils restent alignes entre eux."""
    import json
    data = json.load(open("export/layers.json"))
    boxes = [data["pieces"][n]["bbox"] for n in data["order"]]
    x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes)
    x1 = max(b[2] for b in boxes); y1 = max(b[3] for b in boxes)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    half = max(x1 - x0, y1 - y0) * (1 + margin) / 2
    size = data["size"]
    half = min(half, cx, cy, size - cx, size - cy)
    return tuple(round(v) for v in (cx - half, cy - half, cx + half, cy + half))


CROP = None


def merge(parts):
    """Superpose plusieurs pieces sur la meme toile, en gardant l'alpha le plus fort."""
    out = None
    for name in parts:
        a = np.array(Image.open(f"{SRC}/{name}.png").convert("RGBA"))
        out = a if out is None else np.dstack(
            [out[..., :3], np.maximum(out[..., 3], a[..., 3])])
    if CROP:
        out = out[CROP[1]:CROP[3], CROP[0]:CROP[2]]
    return out


def tint(rgba, rgb):
    a = rgba.copy()
    a[..., 0:3] = rgb
    return a


def write_set(spec, folder, rgb):
    os.makedirs(folder, exist_ok=True)
    for label, parts in spec:
        Image.fromarray(tint(merge(parts), rgb), "RGBA").save(
            f"{folder}/{label}.png", optimize=True)
    return len(spec)


def main():
    global CROP
    CROP = square_crop()
    shutil.rmtree(OUT, ignore_errors=True)
    n = 0
    for jeu, spec in (("lettres", LETTRES), ("anatomie", ANATOMIE)):
        n += write_set(spec, f"{OUT}/{jeu}-noir", (17, 17, 17))
        n += write_set(spec, f"{OUT}/{jeu}-blanc", (255, 255, 255))
    # les plis sont des contre-formes : blancs pour un fond clair, noirs sinon
    n += write_set(PLIS, f"{OUT}/trompe-a-plis/sur-fond-clair", (255, 255, 255))
    n += write_set(PLIS, f"{OUT}/trompe-a-plis/sur-fond-sombre", (17, 17, 17))
    # la trompe pleine garde la couleur du trait, pas celle des plis
    for sub, rgb in (("sur-fond-clair", (17, 17, 17)),
                     ("sur-fond-sombre", (255, 255, 255))):
        Image.fromarray(tint(merge(["trunk_solid"]), rgb), "RGBA").save(
            f"{OUT}/trompe-a-plis/{sub}/trompe-pleine.png", optimize=True)

    print(f"cadre {CROP[2]-CROP[0]} x {CROP[3]-CROP[1]} px  (recadre depuis 1600 x 1600)")
    poids = sum(os.path.getsize(os.path.join(r, f))
                for r, _, fs in os.walk(OUT) for f in fs)
    print(f"{n} PNG ecrits, {poids // 1024} Ko")


if __name__ == "__main__":
    main()
