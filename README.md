# AYOKA — logo en calques

Le logo AYOKA superpose deux lectures : le mot **AYOKA** et une **tête d'éléphant**.
Ce dépôt le découpe en 8 pièces indépendantes, prêtes à animer, en SVG vectoriel et en
PNG transparents.

Aperçu interactif : `demo/index.html` (vue éclatée, visibilité par calque,
quatre scénarios d'animation).

## Les 8 calques

| Pièce | Lettre | Rôle dans l'éléphant | Aire |
|---|---|---|---|
| `A1` | A | oreille gauche, extérieur | 67,8 k px |
| `Y` | Y | oreille gauche, intérieur | 45,2 k px |
| `O` | O | crâne / front | 56,0 k px |
| `K` | K | oreille droite, intérieur | 54,1 k px |
| `A2` | A | oreille droite, extérieur | 65,5 k px |
| `trunk` | — | trompe | 55,6 k px |
| `tusk_L` | — | défense gauche | 11,0 k px |
| `tusk_R` | — | défense droite | 11,2 k px |

Les pièces se regroupent selon la lecture que l'on veut animer :

- **par lettre** — `A1`, `Y`, `O`, `K`, `A2` composent le mot ;
- **par anatomie** — `A1`+`Y` forment l'oreille gauche, `K`+`A2` l'oreille droite,
  `O` le crâne, puis la trompe et les deux défenses.

En prime, la trompe est aussi livrée décomposée : `trunk_solid` (trompe pleine) et
`fold_1` à `fold_4` (les quatre plis, en blanc), pour les faire apparaître un à un.

## Fichiers

```
source/ayoka-logo.png        logo d'origine, 1600 × 1600
export/svg/ayoka-layers.svg  tous les calques, groupés par id  (12 Ko)
export/svg/pieces/*.svg      une pièce par fichier
export/png/*.png             PNG transparents 1600 × 1600
export/png/_complet.png      logo recomposé, pour contrôle
export/png/_planche-controle.png  les 8 pièces en couleurs
export/layers.json           bbox, centroïde et pivot de chaque pièce
demo/index.html              page de prévisualisation
```

Tous les PNG partagent la même toile 1600 × 1600 : **empilés dans l'ordre, ils
redonnent le logo d'origine, sans aucun recalage**.

## Animer

Le SVG est structuré en groupes nommés :

```html
<g id="ayoka">
  <g id="grp-ear-left">   <path id="A1" data-letter="A"/> <path id="Y" data-letter="Y"/> </g>
  <g id="grp-ear-right">  <path id="K"  data-letter="K"/> <path id="A2" data-letter="A"/> </g>
  <g id="grp-skull">      <path id="O"  data-letter="O"/> </g>
  <g id="grp-trunk">      <path id="trunk"/> </g>
  <g id="grp-tusk-left">  <path id="tusk_L"/> </g>
  <g id="grp-tusk-right"> <path id="tusk_R"/> </g>
</g>
<g id="grp-trunk-detailed" style="display:none">  <!-- variante à plis animables -->
```

Pour faire pivoter une pièce sur son articulation, prenez le `pivot` fourni dans
`export/layers.json` (une oreille tourne depuis son bord intérieur, la trompe depuis
son attache sous le crâne) :

```css
#A1 { transform-box: view-box; transform-origin: 527px 470px; }
```

`demo/index.html` montre quatre scénarios construits sur ces pivots : *Lettrage*
(les lettres se posent dans l'ordre de lecture), *Éveil* (le crâne apparaît, les
oreilles se déploient, les défenses poussent, la trompe se déroule), *Trompe*
(les plis apparaissent un à un) et *Au repos*.

## Utiliser dans Canva

Canva aplatit les SVG à l'import : le logo y redevient un bloc unique. Ce sont donc
les PNG qui servent de calques. `export/canva/` contient les jeux prêts à déposer,
recadrés sur un carré serré de 1265 × 1265 px pour que le logo remplisse la page :

```
export/canva/lettres-noir/     8 calques : A, Y, O, K, A, trompe, 2 défenses
export/canva/anatomie-noir/    6 calques : 2 oreilles, crâne, trompe, 2 défenses
export/canva/*-blanc/          les mêmes, en blanc, pour un fond sombre
export/canva/trompe-a-plis/    trompe pleine + ses 4 plis, à animer un à un
export/canva/GUIDE-CANVA.md    import, alignement, chronologie, trois séquences
```

Les fichiers sont numérotés dans l'ordre d'animation et partagent tous le même cadre :
posés à la même taille et centrés, ils s'alignent sans réglage. `GUIDE-CANVA.md`
détaille la mise en place et trois séquences qui marchent.

Pour une archive à glisser dans Canva :

```bash
cd export && zip -r ../ayoka-calques-canva.zip canva
```

## Animation (Remotion)

`animation/` contient un projet [Remotion](https://remotion.dev) qui anime le logo
à partir du **SVG**, pas des PNG : net à toute résolution, avec les vrais pivots.

```bash
cd animation && npm install
npm run dev      # Remotion Studio
npm run render   # 1080 × 1080 → out/ayoka-1080.mp4
```

Trois formats du même film de 3,2 s — carré, story, bannière. Les huit pièces
foncent vers le centre depuis hors-cadre, avec un flou calé sur leur vitesse, et
claquent ensemble : éclair, secousse, le logo encaisse puis se pose. Le rythme se
règle dans `animation/src/theme.ts`. Détails dans `animation/README.md`.

## Régénérer

```bash
pip install pillow numpy scipy potracer
python3 tools/split_logo.py    # découpe et exporte PNG + SVG
python3 tools/build_demo.py    # reconstruit la page de prévisualisation
python3 tools/export_canva.py  # prépare les jeux de calques pour Canva
python3 tools/export_remotion.py  # régénère les tracés du projet Remotion
```

## Notes de découpe

Six des huit pièces se détachent seules : le logo compte exactement six formes
non connexes. Les deux jonctions restantes sont des fusions voulues par le dessin et
demandent une coupe explicite, définie dans `tools/split_logo.py` :

- **`O` / `trunk`** — coupe horizontale à `y = 786`, juste sous le crâne et avant le
  premier pli de la trompe ;
- **`K` / `A2`** — coupe le long du segment `(1122, 448) → (1088, 905)`, du point où le
  bras haut du K rejoint le sommet du A jusqu'à la pointe basse de l'oreille.

Les deux coupes reçoivent 2 px de recouvrement, pour qu'aucun liseré blanc
n'apparaisse au rendu tant que les pièces restent en place. Les bords conservent
l'anticrénelage de l'original, chaque pixel de bordure étant attribué à la pièce la
plus proche. Le logo recomposé s'écarte de la source de 0,13 niveau d'alpha en
moyenne, et le tracé vectoriel couvre 99,5 % de la surface du bitmap.
