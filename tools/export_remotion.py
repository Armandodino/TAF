#!/usr/bin/env python3
"""
Genere le module TypeScript des traces, consomme par le projet Remotion.

Les chemins viennent du SVG vectorise : l'animation reste nette a toute
resolution, et chaque piece garde son point de pivot.

Usage: python3 tools/export_remotion.py
"""
import json
import re

SVG = "export/svg/ayoka-layers.svg"
META = "export/layers.json"
OUT = "animation/src/logo/paths.ts"

EXTRA = ["trunk_solid", "fold_1", "fold_2", "fold_3", "fold_4"]


def main():
    raw = open(SVG).read()
    meta = json.load(open(META))
    paths = dict(re.findall(r'<path id="([^"]+)"[^>]*\sd="([^"]+)"', raw))

    order = meta["order"]
    missing = [n for n in order + EXTRA if n not in paths]
    if missing:
        raise SystemExit(f"traces absents du SVG : {missing}")

    lines = [
        "// Genere par tools/export_remotion.py — ne pas editer a la main.",
        "// Source : export/svg/ayoka-layers.svg",
        "",
        f"export const CANVAS = {meta['size']};",
        "",
        "export type PieceName =",
        *[f"  | '{n}'" for n in order],
        "  ;",
        "",
        "export type Piece = {",
        "  /** Lettre du mot, quand la piece en est une. */",
        "  letter: string | null;",
        "  /** Role dans la tete d'elephant. */",
        "  role: string;",
        "  /** Point de rotation naturel, en coordonnees de la toile. */",
        "  pivot: readonly [number, number];",
        "  /** Boite englobante [x0, y0, x1, y1]. */",
        "  bbox: readonly [number, number, number, number];",
        "  /** Centre de gravite, en coordonnees de la toile. */",
        "  centroid: readonly [number, number];",
        "  d: string;",
        "};",
        "",
        "export const ORDER: readonly PieceName[] = [",
        *[f"  '{n}'," for n in order],
        "] as const;",
        "",
        "/** Les cinq lettres, dans l'ordre de lecture. */",
        "export const LETTERS: readonly PieceName[] = "
        f"[{', '.join(repr(n) for n in order if meta['pieces'][n]['letter'])}]"
        ".map((n) => n as PieceName);",
        "",
        "export const PIECES: Record<PieceName, Piece> = {",
    ]

    for name in order:
        p = meta["pieces"][name]
        letter = f"'{p['letter']}'" if p["letter"] else "null"
        lines += [
            f"  {name}: {{",
            f"    letter: {letter},",
            f"    role: {json.dumps(p['role'], ensure_ascii=False)},",
            f"    pivot: [{p['pivot'][0]}, {p['pivot'][1]}],",
            f"    bbox: [{', '.join(str(v) for v in p['bbox'])}],",
            f"    centroid: [{p['centroid'][0]}, {p['centroid'][1]}],",
            f"    d: '{paths[name]}',",
            "  },",
        ]
    lines += ["};", ""]

    # variante detaillee de la trompe : forme pleine + les quatre plis
    lines += [
        "/** Trompe pleine, plis non perces. */",
        f"export const TRUNK_SOLID = '{paths['trunk_solid']}';",
        "",
        "/** Les quatre plis de la trompe, de haut en bas. Ce sont des",
        " *  contre-formes : a peindre de la couleur du fond. */",
        "export const TRUNK_FOLDS: readonly string[] = [",
        *[f"  '{paths[f'fold_{i}']}'," for i in (1, 2, 3, 4)],
        "];",
        "",
    ]

    # cadre serre, pour composer sans le vide de la toile d'origine
    boxes = [meta["pieces"][n]["bbox"] for n in order]
    x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes)
    x1 = max(b[2] for b in boxes); y1 = max(b[3] for b in boxes)
    lines += [
        "/** Boite du logo dans la toile, sans marge. */",
        f"export const LOGO_BOX = {{x: {x0}, y: {y0}, "
        f"width: {x1 - x0}, height: {y1 - y0}}} as const;",
        "",
    ]

    open(OUT, "w").write("\n".join(lines))
    total = sum(len(paths[n]) for n in order)
    print(f"{OUT} ecrit — {len(order)} pieces, {total // 1024} Ko de traces")


if __name__ == "__main__":
    main()
