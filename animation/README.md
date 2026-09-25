# Animation AYOKA — Remotion

Film de marque construit sur le découpage en calques du logo. L'animation part du
**SVG vectoriel** et non des PNG : le rendu reste net à n'importe quelle résolution,
et chaque pièce garde son point de pivot.

## Lancer

```bash
cd animation
npm install
npm run dev        # Remotion Studio, prévisualisation image par image
```

## Rendre

```bash
npm run render         # AyokaSquare  1080 × 1080
npm run render:reel    # AyokaReel    1080 × 1920
npm run render:banner  # AyokaBanner  1920 × 1080
npm run render:gif     # le carré, en GIF
npm run still          # dernière image en PNG
```

Trois compositions, même film : carré sur fond ivoire, story et reel sur fond noir,
bannière sur fond ivoire. La largeur du logo suit le rapport de l'image, le reste
est commun.

## Le film

3,2 secondes à 30 images/s. Il n'y a pas de révélation progressive : il y a une
course, un choc, et l'image qui encaisse.

| Images | Ce qui se passe |
|---|---|
| 0 → 26 | les huit pièces foncent vers le centre depuis hors-cadre, en accélérant, avec un flou qui suit leur vitesse |
| 29 | **le choc** — la dernière pièce se cale : éclair, secousse de caméra, le logo passe sous sa taille puis revient |
| 44 → 58 | un éclat balaye le logo |
| jusqu'à la fin | rapproché très lent, logo net |

Trois détails font le gros du travail :

- **Le flou suit la vitesse réelle.** La position de chaque pièce est dérivée d'une
  image à l'autre, et l'écart devient l'écart-type d'un flou gaussien par axe. Une
  pièce lancée horizontalement s'étire horizontalement.
- **Les pièces arrivent quasi ensemble**, décalées de 1,6 image seulement. Assez peu
  pour être perçu comme un seul coup, assez pour qu'on lise l'assemblage. Le crâne
  ouvre, la trompe ferme.
- **Les distances d'entrée sont calculées depuis le bord du cadre**, pas écrites en
  dur. Une valeur fixe assez grande pour le format portrait laisserait le carré vide
  une demi-seconde ; l'inverse ferait démarrer les pièces déjà à l'écran.

## Régler

- **`src/theme.ts`** — couleurs et minutage, tout en images. `impact` déplace le
  choc, `stagger` resserre ou étale l'assemblage, `flashDuration` la durée de
  l'éclair.
- **`src/AyokaImpact.tsx`** — `FLIGHT` dit par où arrive chaque pièce (une
  direction, pas une distance), sa rotation d'entrée et son rang dans
  l'assemblage. `BLUR_GAIN` et `BLUR_CEILING` dosent la traînée.
- **`src/Root.tsx`** — formats, couleurs par composition, et la ligne `tagline`
  sous le logo. Vide par défaut : le film finit sur le logo seul.
- **`src/logo/LogoLayers.tsx`** — rendu des pièces, filtres de flou et éclat.

Pour une tagline :

```tsx
const dark: AyokaImpactProps = {
  background: THEME.ink,
  ink: THEME.ivory,
  tagline: 'Fait à Paris',   // capitales, lettrage espacé
};
```

## Les tracés

`src/logo/paths.ts` est **généré**, ne pas l'éditer à la main. Il vient du SVG
découpé, et porte pour chaque pièce son tracé, sa lettre, son rôle dans l'éléphant,
sa boîte englobante et son pivot. Pour le régénérer après une retouche du découpage :

```bash
cd .. && python3 tools/export_remotion.py
```

Le module exporte aussi `TRUNK_SOLID` et `TRUNK_FOLDS` : la trompe sans ses plis,
plus les quatre plis séparés, si tu veux les faire apparaître un à un.

## Note de rendu

Remotion télécharge son propre Chrome au premier rendu. Si une installation gêne,
passe le binaire explicitement :

```bash
npx remotion render AyokaSquare out/ayoka.mp4 --browser-executable=/chemin/vers/chrome
```
