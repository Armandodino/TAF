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
npm run products          # détoure les packshots et régénère le manifeste
npm run render:film       # la pub, 1920 × 1080, une minute
npm run render:film:vertical  # la même en 1080 × 1920

npm run render            # logo seul, 1080 × 1080
npm run render:reel       # logo seul, 1080 × 1920
npm run render:banner     # logo seul, 1920 × 1080
```

## La pub

Une minute, neuf scènes, format horizontal par défaut. **Le film ne montre que
les produits ; le logo n'entre qu'à la fin**, en assemblage, suivi du générique.

| Temps | Scène |
|---|---|
| 0–4 s | une pièce descend dans le noir, la lumière la révèle en la balayant |
| 4–18 s | hoodie, plein cadre, qui tourne au-dessus de son reflet |
| 18–31 s | sweat vert, après une bascule 3D |
| 31–42 s | t-shirt, après un filage |
| 42–54 s | les accessoires, en duo |
| 54–68 s | le défilé : toutes les pièces traversent le cadre |
| 68–79 s | le mur : la collection entière, puis ruée vers l'objectif |
| 79–91 s | **l'assemblage du logo** |
| 91–100 % | générique |

Les raccords sont écrits à la main : ouverture en iris, bascule 3D, filage
avec flou, coup de zoom, déraillement en bandes. Les fondus livrés avec
Remotion ne se voient pas dans un montage court.

## Les produits

Les visuels de la charte sont des packshots posés sur un fond uni. Recadrés
dans le cadre, ils se ressemblent tous et on ne voit jamais la pièce entière.
Ils sont donc **détourés** une fois pour toutes :

```bash
npm run products     # détoure public/charte → public/produits, puis régénère le manifeste
```

`tools/cutout_products.py` repère le fond par propagation depuis les bords,
pas par simple seuil — un seuil global percerait aussi le logo blanc imprimé
sur un t-shirt noir. `tools/scan_products.py` en tire `src/ad/products.ts` :
dimensions, couleur dominante, et le fond de marque qui contraste le mieux
avec elle.

Une fois libres, les pièces sont des objets : `src/ad/Product.tsx` leur donne
une ombre portée qui épouse leur contour réel (un `drop-shadow`, pas une
ellipse posée dessous), un reflet au sol, un balayage de lumière masqué par
leur propre silhouette, et une rotation dans la profondeur.

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
