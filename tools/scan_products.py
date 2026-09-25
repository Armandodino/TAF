#!/usr/bin/env python3
"""
Ecrit le manifeste des produits detoures consomme par le film.

Pour chaque piece : ses dimensions, sa couleur dominante et une couleur de
fond choisie pour la porter. La palette du film sort donc des vetements
eux-memes, pas d'un nuancier plaque par-dessus.

Usage: python3 tools/scan_products.py
"""
import colorsys
import json
import os
import re

import numpy as np
from PIL import Image

SRC = "animation/public/produits"
OUT = "animation/src/ad/products.ts"

#: Noms lisibles, pour la legende a l'ecran.
LABELS = {
    "hoodie": "Hoodie",
    "sweatshirt": "Sweatshirt",
    "tshirt": "T-shirt",
    "casquette": "Casquette",
    "buckethat": "Bob",
    "joggers": "Jogger",
    "gymwear": "Ensemble",
    "backpack": "Sac",
    "cap": "Casquette",
}
COLORS = {
    "orange": "Orange", "vert": "Vert", "noir": "Noir",
    "noire": "Noire", "blanc": "Blanc", "ivoire": "Ivoire",
}


def label_of(stem: str) -> str:
    parts = re.split(r"[_-]", stem.replace("ayoka_", ""))
    kind = next((LABELS[p] for p in parts if p in LABELS), parts[0].title())
    tone = next((COLORS[p] for p in parts if p in COLORS), None)
    return f"{kind} {tone}" if tone else kind


def dominant(rgba: np.ndarray) -> tuple[int, int, int]:
    """Couleur la plus presente parmi les pixels opaques, hors quasi-blanc."""
    solid = rgba[rgba[..., 3] > 200][:, :3]
    if len(solid) == 0:
        return (128, 128, 128)
    # le logo imprime est blanc sur presque toutes les pieces : l'ecarter,
    # sinon toutes les couleurs dominantes sortent blanches
    keep = solid.max(axis=1) < 235
    pool = solid[keep] if keep.sum() > len(solid) * 0.2 else solid
    quant = (pool // 24 * 24).astype(np.uint8)
    keys, counts = np.unique(quant.reshape(-1, 3), axis=0, return_counts=True)
    return tuple(int(v) for v in keys[counts.argmax()])


#: Palette de la marque : le noir et l'ivoire du logo, l'orange et le vert
#: releves sur les pieces elles-memes.
BRAND = {
    "ink": (11, 11, 11),
    "ivory": (242, 239, 233),
    "orange": (216, 72, 0),
    "forest": (24, 48, 24),
}


def luma(rgb) -> float:
    r, g, b = (v / 255 for v in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def backdrop(rgb: tuple[int, int, int], rank: int) -> str:
    """
    Fond choisi pour detacher la piece, pas pour l'accompagner.

    La plupart des pieces sont noires : un fond de leur propre teinte les
    ferait disparaitre. On prend donc, dans la palette de marque, le fond le
    plus eloigne en clarte, en alternant entre les deux meilleurs candidats
    pour que deux plans voisins ne tombent pas sur le meme.
    """
    target = luma(rgb)
    ranked = sorted(BRAND.values(), key=lambda c: -abs(luma(c) - target))
    pick = ranked[rank % 2]
    return "#%02X%02X%02X" % pick


def main():
    rows = []
    for name in sorted(os.listdir(SRC)):
        if not name.endswith(".png"):
            continue
        im = Image.open(f"{SRC}/{name}").convert("RGBA")
        a = np.array(im)
        rgb = dominant(a)
        stem = os.path.splitext(name)[0]
        rank = len(rows)
        rows.append({
            "file": f"produits/{name}",
            "label": label_of(stem),
            "width": im.width,
            "height": im.height,
            "color": "#%02X%02X%02X" % rgb,
            "backdrop": backdrop(rgb, rank),
        })

    body = [
        "// Genere par tools/scan_products.py — ne pas editer a la main.",
        "// Produits detoures, avec la couleur qu'ils portent et le fond qui la sert.",
        "",
        "export type Product = {",
        "  file: string;",
        "  label: string;",
        "  width: number;",
        "  height: number;",
        "  /** Couleur dominante de la piece. */",
        "  color: string;",
        "  /** Fond profond de meme teinte, pour la poser dessus. */",
        "  backdrop: string;",
        "};",
        "",
        "export const PRODUCTS: readonly Product[] = [",
    ]
    for r in rows:
        body.append("  " + json.dumps(r, ensure_ascii=False) + ",")
    body += [
        "];",
        "",
        "export const COUNT = PRODUCTS.length;",
        "",
        "/** Produit au rang demande, en bouclant. */",
        "export const productAt = (i: number): Product =>",
        "  PRODUCTS[((i % COUNT) + COUNT) % COUNT];",
        "",
    ]
    open(OUT, "w").write("\n".join(body))
    print(f"{OUT} — {len(rows)} produits")
    for r in rows:
        print(f"  {r['label']:22s} {r['color']}  sur {r['backdrop']}")


if __name__ == "__main__":
    main()
