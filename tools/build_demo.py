#!/usr/bin/env python3
"""
Construit la page de previsualisation des calques a partir des exports.

Lit export/svg/ayoka-layers.svg et export/layers.json, puis ecrit :
  demo/index.html    document complet, a ouvrir dans un navigateur
  demo/fragment.html meme page sans l'enveloppe <html>, pour publication

Usage: python3 tools/build_demo.py
"""
import json
import os
import re

SVG = "export/svg/ayoka-layers.svg"
JSON = "export/layers.json"
TEMPLATE = "tools/demo_template.html"


CENTER = (800, 720)   # centre d'ou partent les pieces en vue eclatee
SPREAD = 0.30         # amplitude max de l'ecartement
MARGIN = 26


def display_box(data):
    """Cadrage qui contient le logo au repos ET a l'ecartement maximal."""
    xs, ys, xe, ye = [], [], [], []
    for name in data["order"]:
        x0, y0, x1, y1 = data["pieces"][name]["bbox"]
        cx, cy = data["pieces"][name]["centroid"]
        for k in (0.0, SPREAD):
            dx, dy = (cx - CENTER[0]) * k, (cy - CENTER[1]) * k
            xs.append(x0 + dx); ys.append(y0 + dy)
            xe.append(x1 + dx); ye.append(y1 + dy)
    x0, y0 = min(xs) - MARGIN, min(ys) - MARGIN
    w, h = max(xe) + MARGIN - x0, max(ye) + MARGIN - y0
    return f"{x0:.0f} {y0:.0f} {w:.0f} {h:.0f}", round(w / h, 4)


def prepare_svg(raw, order, view_box):
    """Enveloppe chaque piece dans un <g class="piece"> : l'enveloppe porte la vue
    eclatee, le <path> porte l'animation, sans que les deux se marchent dessus."""
    svg = raw.replace('width="1600" height="1600"', 'preserveAspectRatio="xMidYMid meet"')
    svg = svg.replace('viewBox="0 0 1600 1600"', f'viewBox="{view_box}"', 1)
    for name in order:
        svg = re.sub(
            rf'(<path id="{re.escape(name)}"[^>]*/>)',
            r'<g class="piece">\1</g>',
            svg, count=1)
    return svg


def main():
    data = json.load(open(JSON))
    view_box, ratio = display_box(data)
    data["display"] = {"center": list(CENTER), "spread": SPREAD,
                       "viewBox": view_box, "ratio": ratio}
    svg = prepare_svg(open(SVG).read(), data["order"], view_box)
    tpl = open(TEMPLATE).read()

    fragment = tpl.replace("{{SVG}}", svg).replace(
        "{{DATA}}", json.dumps(data, ensure_ascii=False, separators=(",", ":")))

    os.makedirs("demo", exist_ok=True)
    with open("demo/fragment.html", "w") as f:
        f.write(fragment)

    # meme page, enveloppee pour un double-clic depuis le disque
    with open("demo/index.html", "w") as f:
        f.write('<!doctype html>\n<html lang="fr">\n<head>\n'
                '<meta charset="utf-8">\n'
                '<meta name="viewport" content="width=device-width,initial-scale=1,'
                'viewport-fit=cover">\n'
                '<style>:root{color-scheme:light;'
                'padding-top:env(safe-area-inset-top,0px);'
                'padding-bottom:env(safe-area-inset-bottom,0px)}'
                'body{margin:0;font:14px system-ui,sans-serif}'
                'img{max-width:100%}[hidden]{display:none!important}</style>\n'
                '</head>\n<body>\n' + fragment + '\n</body>\n</html>\n')

    for p in ("demo/index.html", "demo/fragment.html"):
        print(f"{p}  {os.path.getsize(p) // 1024} Ko")


if __name__ == "__main__":
    main()
