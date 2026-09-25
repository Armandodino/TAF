#!/usr/bin/env python3
"""
Detoure les packshots de leur fond uni.

Les visuels de la charte sont des produits poses au centre d'un fond clair.
Recadres dans le cadre, ils se ressemblent tous et on ne voit jamais la piece
entiere. Detoures, ils deviennent des objets libres : on peut les poser sur le
fond qu'on veut, les faire tourner, leur donner une ombre.

Le fond est repere par propagation depuis les bords, pas par simple seuil :
un seuil global percerait aussi les zones claires du produit lui-meme, comme
le logo blanc imprime sur un t-shirt noir.

Usage: python3 tools/cutout_products.py
"""
import os

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = "animation/public/charte"
OUT = "animation/public/produits"

#: Ecart tolere autour de la couleur des coins, par canal.
#: Genereux a dessein : l'ombre portee d'un produit tire vers un gris clair que
#: seul un seuil large attrape, et les pieces sont soit tres sombres soit tres
#: saturees, donc hors d'atteinte de ce seuil.
TOLERANCE = 58
#: Marge laissee autour du produit, en fraction de sa plus grande dimension.
MARGIN = 0.04


def background_mask(rgb: np.ndarray) -> np.ndarray:
    """Pixels du fond : proches de la couleur des coins ET relies a un bord."""
    h, w = rgb.shape[:2]
    corners = np.concatenate([
        rgb[:12, :12].reshape(-1, 3), rgb[:12, -12:].reshape(-1, 3),
        rgb[-12:, :12].reshape(-1, 3), rgb[-12:, -12:].reshape(-1, 3),
    ])
    ref = np.median(corners, axis=0)
    close = np.abs(rgb.astype(np.int16) - ref).max(axis=2) <= TOLERANCE

    # ne garder que ce qui communique avec un bord : une zone claire enfermee
    # dans le produit (un logo imprime) n'est pas du fond
    lab, n = ndimage.label(close)
    if n == 0:
        return np.zeros((h, w), bool)
    edge = set(lab[0].tolist()) | set(lab[-1].tolist())
    edge |= set(lab[:, 0].tolist()) | set(lab[:, -1].tolist())
    edge.discard(0)
    return np.isin(lab, list(edge))


def cutout(path: str) -> Image.Image | None:
    im = Image.open(path).convert("RGB")
    rgb = np.array(im)
    bg = background_mask(rgb)
    fg = ~bg

    # les ombres portees laissent des miettes : ne garder que la piece
    fg = ndimage.binary_closing(fg, np.ones((5, 5)))
    lab, n = ndimage.label(fg)
    if n == 0:
        return None
    sizes = ndimage.sum(fg, lab, range(1, n + 1))
    fg = lab == (int(np.argmax(sizes)) + 1)
    fg = ndimage.binary_fill_holes(fg)
    # une ombre assez sombre pour passer le seuil reste accrochee au produit
    # par un pont etroit : une ouverture la detache sans entamer les masses
    radius = max(4, int(min(fg.shape) * 0.009))
    disc = np.hypot(*np.ogrid[-radius:radius + 1, -radius:radius + 1]) <= radius
    fg = ndimage.binary_opening(fg, disc)
    lab, n = ndimage.label(fg)
    if n > 1:
        sizes = ndimage.sum(fg, lab, range(1, n + 1))
        fg = lab == (int(np.argmax(sizes)) + 1)

    alpha = Image.fromarray((fg * 255).astype(np.uint8))
    # un bord net accroche l'oeil : un demi-pixel de flou suffit a l'adoucir
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.8))

    out = im.convert("RGBA")
    out.putalpha(alpha)

    ys, xs = np.nonzero(fg)
    pad = int(max(np.ptp(xs), np.ptp(ys)) * MARGIN)
    box = (max(0, xs.min() - pad), max(0, ys.min() - pad),
           min(im.width, xs.max() + pad), min(im.height, ys.max() + pad))
    return out.crop(box)


def main():
    os.makedirs(OUT, exist_ok=True)
    for name in sorted(os.listdir(SRC)):
        if not name.lower().endswith((".webp", ".png", ".jpg", ".jpeg")):
            continue
        cut = cutout(f"{SRC}/{name}")
        if cut is None:
            print(f"  {name}: aucun produit trouve")
            continue
        stem = os.path.splitext(name)[0]
        cut.save(f"{OUT}/{stem}.png", optimize=True)
        covered = np.array(cut)[..., 3] > 128
        print(f"  {stem}: {cut.width} x {cut.height}, "
              f"{covered.mean() * 100:.0f}% de matiere")


if __name__ == "__main__":
    main()
