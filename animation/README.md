# Animation AYOKA — Remotion

Film de marque construit sur le découpage en calques du logo. L'animation part du
**SVG vectoriel** et non des PNG : le rendu reste net à n'importe quelle résolution,
et chaque pièce garde son point de pivot.

## Lancer

```bash
cd animation
npm install
npm run dev        # ouvre Remotion Studio, prévisualisation image par image
```

## Rendre

```bash
npm run render       # AyokaReveal  1080 × 1080  → out/ayoka-1080.mp4
npm run render:reel  # AyokaReel    1080 × 1920  → out/ayoka-reel.mp4
npm run render:gif   # même film en GIF
npm run still        # dernière image en PNG
```

Trois compositions, même film : `AyokaReveal` (post carré, fond ivoire),
`AyokaReel` (story et reel, fond noir), `AyokaBanner` (1920 × 1080, bannière).
La largeur du logo s'adapte au format, le reste est commun.

## Le film

5 secondes à 30 images/s.

| Temps | Ce qui se passe |
|---|---|
| 0,2 → 1,9 s | les cinq lettres se posent, dans l'ordre de lecture |
| 1,8 → 2,6 s | les défenses descendent |
| 2,1 → 3,2 s | la trompe se déroule |
| 3,3 → 4,1 s | le trait se trace sous le logo |
| tout du long | rapproché très lent, pour que l'image respire |

Chaque pièce se découvre derrière un **volet** fixé à sa place définitive, pendant
qu'elle glisse vers cette place. La forme se dévoile donc là où elle doit finir, au
lieu d'arriver en bloc — c'est ce qui donne le mouvement « imprimé » plutôt que
« diaporama ».

## Régler

- **`src/theme.ts`** — couleurs et minutage. Tout le rythme est dans `BEATS`, en
  images : décaler `letterStagger` change la cadence des lettres, `trunkDuration`
  la lenteur de la trompe.
- **`src/Root.tsx`** — formats, couleurs par composition, et la ligne `tagline`
  sous le logo (vide par défaut : le film finit sur le logo seul).
- **`src/AyokaReveal.tsx`** — la chorégraphie : quelle pièce part d'où, avec quel
  glissement et quelle bascule d'entrée.
- **`src/logo/LogoLayers.tsx`** — le rendu des volets.

Pour une tagline :

```tsx
const light: AyokaRevealProps = {
  background: THEME.ivory,
  ink: THEME.ink,
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

Remotion télécharge son propre Chrome au premier rendu. Si une installation de
Chrome traîne déjà et pose problème, passe le binaire explicitement :

```bash
npx remotion render AyokaReveal out/ayoka.mp4 --browser-executable=/chemin/vers/chrome
```
