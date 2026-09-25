#!/usr/bin/env python3
"""
Decoupe le logo AYOKA en calques independants, prets a animer.

Le logo superpose deux lectures : le mot AYOKA et une tete d'elephant.
Le script produit 8 pieces atomiques, regroupables selon les deux lectures :

  piece        lettre   role elephant
  ---------------------------------------
  A1           A        oreille gauche (exterieur)
  Y            Y        oreille gauche (interieur)
  O            O        crane / front
  K            K        oreille droite (interieur)
  A2           A        oreille droite (exterieur)
  trunk        -        trompe
  tusk_L       -        defense gauche
  tusk_R       -        defense droite

Sorties : PNG transparents 1600x1600 tous alignes sur la meme toile
(superposables sans recalage) + SVG vectoriels, pieces separees et
fichier unique a groupes nommes.

Usage: python3 tools/split_logo.py
"""
import json
import os

import numpy as np
import potrace
from PIL import Image
from scipy import ndimage

SRC = "source/ayoka-logo.png"
OUT_PNG = "export/png"
OUT_SVG = "export/svg"
SIZE = 1600

# --- geometrie des deux coupes, relevee sur l'image source ---
TRUNK_CUT_Y = 786          # separation crane / trompe
KA_CUT = ((1122, 448), (1088, 905))   # separation K / A, segment oriente
OVERLAP = 2                # px de recouvrement sur les coupes artificielles

ORDER = ["A1", "Y", "O", "K", "A2", "trunk", "tusk_L", "tusk_R"]

LETTER = {"A1": "A", "Y": "Y", "O": "O", "K": "K", "A2": "A"}
ROLE = {
    "A1": "oreille gauche, extérieur",
    "Y": "oreille gauche, intérieur",
    "O": "crâne / front",
    "K": "oreille droite, intérieur",
    "A2": "oreille droite, extérieur",
    "trunk": "trompe",
    "tusk_L": "défense gauche",
    "tusk_R": "défense droite",
}
# point de rotation naturel de chaque piece, pour l'animation
PIVOT = {
    "A1": (527, 470), "Y": (709, 470), "O": (801, 700), "K": (897, 470),
    "A2": (1087, 470), "trunk": (830, 790), "tusk_L": (668, 800),
    "tusk_R": (936, 800),
}
GROUPS = {
    "ear-left":   ["A1", "Y"],
    "ear-right":  ["K", "A2"],
    "skull":      ["O"],
    "trunk":      ["trunk"],
    "tusk-left":  ["tusk_L"],
    "tusk-right": ["tusk_R"],
}
# couleurs de reperage, uniquement pour la planche de controle et la demo
DEBUG_COLORS = {
    "A1": "#E23B3B", "Y": "#F0A01E", "O": "#3278E6", "K": "#28B45A",
    "A2": "#8CDC3C", "trunk": "#00A0FF", "tusk_L": "#AA46C8", "tusk_R": "#00BEBE",
}


# niveaux releves sur la source : le fond WebP plafonne a 253, l'encre a ~16
INK_LEVEL, BG_LEVEL = 16, 252


def load():
    g = np.array(Image.open(SRC).convert("L")).astype(np.int16)
    mask = g < 128
    # boucher le bruit de compression : micro-trous sans intention graphique
    holes = ndimage.binary_fill_holes(mask) & ~mask
    hl, hn = ndimage.label(holes)
    if hn:
        sizes = ndimage.sum(holes, hl, range(1, hn + 1))
        for i in np.nonzero(sizes < 20)[0] + 1:
            mask[hl == i] = True
    return g, mask


def side_of_line(shape, p1, p2):
    """Masque des points situes a gauche de la droite orientee p1->p2."""
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]]
    cross = (p2[0] - p1[0]) * (yy - p1[1]) - (p2[1] - p1[1]) * (xx - p1[0])
    return cross > 0


def despeckle(pieces, min_px=600):
    """Reattribue a la piece voisine les miettes laissees par une coupe."""
    for name, m in pieces.items():
        lab, n = ndimage.label(m)
        if n <= 1:
            continue
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        keep = sizes.argmax() + 1
        for i in range(1, n + 1):
            if i == keep or sizes[i - 1] >= min_px:
                continue
            crumb = lab == i
            m[crumb] = False
            # rendre la miette a la piece qui la touche le plus
            near = ndimage.binary_dilation(crumb, iterations=2)
            best, score = None, 0
            for other, om in pieces.items():
                if other == name:
                    continue
                s = int((near & om).sum())
                if s > score:
                    best, score = other, s
            if best:
                pieces[best][crumb] = True
    return pieces


def build_pieces(mask):
    lab, _ = ndimage.label(mask)
    # composantes reperees par taille/position lors de l'analyse
    c_A1, c_trunkO, c_KA, c_Y, c_tuskL, c_tuskR = (lab == i for i in (1, 2, 3, 4, 5, 6))

    yy = np.mgrid[0:SIZE, 0:SIZE][0]
    upper = yy < TRUNK_CUT_Y
    left = side_of_line(mask.shape, *KA_CUT)

    pieces = {
        "A1": c_A1.copy(),
        "Y": c_Y.copy(),
        "O": (c_trunkO & upper),
        "trunk": (c_trunkO & ~upper),
        "K": (c_KA & left),
        "A2": (c_KA & ~left),
        "tusk_L": c_tuskL.copy(),
        "tusk_R": c_tuskR.copy(),
    }
    pieces = despeckle(pieces)

    # recouvrement sur les coupes artificielles : evite le liseré blanc
    for a, b, parent in (("O", "trunk", c_trunkO), ("K", "A2", c_KA)):
        for name in (a, b):
            pieces[name] = ndimage.binary_dilation(
                pieces[name], iterations=OVERLAP) & parent
    return pieces


def alpha_of(gray, mask, pieces):
    """Alpha antialiase, chaque pixel de bord rendu a la piece la plus proche."""
    alpha = ((BG_LEVEL - gray) * 255.0 / (BG_LEVEL - INK_LEVEL))
    alpha = alpha.clip(0, 255).astype(np.uint8)
    # l'antialiasing ne depasse pas quelques px : au-dela c'est du bruit WebP
    alpha[~ndimage.binary_dilation(mask, iterations=4)] = 0
    owner = np.zeros(mask.shape, np.int32)
    for i, name in enumerate(ORDER, 1):
        owner[pieces[name]] = i
    _, (iy, ix) = ndimage.distance_transform_edt(owner == 0, return_indices=True)
    filled = owner[iy, ix]          # propage l'appartenance sur les bords gris
    filled[alpha == 0] = 0          # ... sans deborder sur le fond
    return alpha, filled


def write_png(path, alpha, keep, rgb=(17, 17, 17)):
    a = np.where(keep, alpha, 0).astype(np.uint8)
    img = np.zeros(a.shape + (4,), np.uint8)
    img[..., 0], img[..., 1], img[..., 2] = rgb
    img[..., 3] = a
    Image.fromarray(img, "RGBA").save(path, optimize=True)


def trace(binary):
    """Vectorise un masque binaire -> attribut 'd' SVG."""
    # potracer attend une image en niveaux de gris : encre sombre sur fond clair
    bmp = potrace.Bitmap(np.where(binary, 0, 255).astype(np.uint8))
    path = bmp.trace(turdsize=8, alphamax=1.0, opticurve=True, opttolerance=0.2)
    out = []
    for curve in path:
        p = curve.start_point
        out.append(f"M{p.x:.2f},{p.y:.2f}")
        for seg in curve:
            e = seg.end_point
            if seg.is_corner:
                c = seg.c
                out.append(f"L{c.x:.2f},{c.y:.2f}L{e.x:.2f},{e.y:.2f}")
            else:
                a, b = seg.c1, seg.c2
                out.append(f"C{a.x:.2f},{a.y:.2f} {b.x:.2f},{b.y:.2f} {e.x:.2f},{e.y:.2f}")
        out.append("Z")
    return "".join(out)


def main():
    gray, mask = load()
    pieces = build_pieces(mask)
    alpha, owner = alpha_of(gray, mask, pieces)

    os.makedirs(f"{OUT_SVG}/pieces", exist_ok=True)
    meta, paths = {}, {}

    for i, name in enumerate(ORDER, 1):
        keep = owner == i
        write_png(f"{OUT_PNG}/{name}.png", alpha, keep)
        d = trace(pieces[name])
        paths[name] = d
        with open(f"{OUT_SVG}/pieces/{name}.svg", "w") as f:
            f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">'
                    f'<path fill="#111" fill-rule="evenodd" d="{d}"/></svg>')
        ys, xs = np.nonzero(keep)
        meta[name] = {
            "letter": LETTER.get(name),
            "role": ROLE[name],
            "color": DEBUG_COLORS[name],
            "pivot": list(PIVOT[name]),
            "pixels": int(keep.sum()),
            "bbox": [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
            "centroid": [round(float(xs.mean()), 1), round(float(ys.mean()), 1)],
        }

    # planche de controle
    check = np.full((SIZE, SIZE, 3), 255, np.float32)
    a = (alpha / 255.0)[..., None]
    for i, name in enumerate(ORDER, 1):
        c = DEBUG_COLORS[name].lstrip("#")
        rgb = np.array([int(c[j:j + 2], 16) for j in (0, 2, 4)], np.float32)
        sel = (owner == i)[..., None]
        check = np.where(sel, check * (1 - a) + rgb * a, check)
    Image.fromarray(check.astype(np.uint8)).save(f"{OUT_PNG}/_planche-controle.png")

    # plis de la trompe : contre-formes blanches, utiles pour les animer a part
    trunk_solid = ndimage.binary_fill_holes(pieces["trunk"])
    folds = trunk_solid & ~pieces["trunk"]
    fl, fn = ndimage.label(folds)
    sizes = ndimage.sum(folds, fl, range(1, fn + 1))
    keep_ids = [i for i in range(1, fn + 1) if sizes[i - 1] >= 50]
    keep_ids.sort(key=lambda i: ndimage.center_of_mass(fl == i)[0])   # haut -> bas
    fold_paths = []
    for rank, i in enumerate(keep_ids, 1):
        f = fl == i
        write_png(f"{OUT_PNG}/fold_{rank}.png", np.full_like(alpha, 255), f,
                  rgb=(255, 255, 255))
        fold_paths.append(trace(f))
        meta[f"fold_{rank}"] = {"letter": None, "pixels": int(f.sum()),
                                "detail_of": "trunk"}
    d_solid = trace(trunk_solid)
    write_png(f"{OUT_PNG}/trunk_solid.png", alpha, trunk_solid)
    meta["trunk_solid"] = {"letter": None, "pixels": int(trunk_solid.sum()),
                           "detail_of": "trunk"}
    with open(f"{OUT_SVG}/pieces/trunk_solid.svg", "w") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">'
                f'<path fill="#111" d="{d_solid}"/></svg>')
    for rank, d in enumerate(fold_paths, 1):
        with open(f"{OUT_SVG}/pieces/fold_{rank}.svg", "w") as f:
            f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">'
                    f'<path fill="#fff" d="{d}"/></svg>')
    paths["trunk_solid"] = d_solid
    for rank, d in enumerate(fold_paths, 1):
        paths[f"fold_{rank}"] = d

    # logo recompose, doit etre identique a la source
    write_png(f"{OUT_PNG}/_complet.png", alpha, owner > 0)

    # SVG unique a groupes nommes
    body = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}" '
            f'width="{SIZE}" height="{SIZE}">',
            '<g id="ayoka" fill="#111" fill-rule="evenodd">']
    for gid, members in GROUPS.items():
        body.append(f'<g id="grp-{gid}">')
        for name in members:
            lt = f' data-letter="{LETTER[name]}"' if name in LETTER else ""
            body.append(f'<path id="{name}"{lt} d="{paths[name]}"/>')
        body.append("</g>")
    body.append("</g>")
    # variante : trompe pleine + plis separes, pour animer les plis un a un
    body.append('<g id="grp-trunk-detailed" fill="#111" fill-rule="evenodd" '
                'style="display:none">')
    body.append(f'<path id="trunk_solid" d="{paths["trunk_solid"]}"/>')
    for rank in range(1, len(fold_paths) + 1):
        body.append(f'<path id="fold_{rank}" fill="#fff" '
                    f'd="{paths[f"fold_{rank}"]}"/>')
    body.append("</g></svg>")
    with open(f"{OUT_SVG}/ayoka-layers.svg", "w") as f:
        f.write("\n".join(body))

    json.dump({"size": SIZE, "order": ORDER, "groups": GROUPS, "pieces": meta},
              open("export/layers.json", "w"), indent=2)

    total = sum(meta[n]["pixels"] for n in ORDER)
    print(f"{len(ORDER)} calques ecrits")
    for name in ORDER:
        m = meta[name]
        print(f"  {name:8s} {m['pixels']:7d}px  bbox={m['bbox']}")
    print(f"couverture: {total} px pour {int((alpha>0).sum())} px d'encre source")


if __name__ == "__main__":
    main()
