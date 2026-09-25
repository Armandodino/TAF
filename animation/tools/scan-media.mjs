// Scanne public/charte et ecrit le manifeste consomme par le film.
// Remotion ne peut pas lister un dossier au rendu : il lui faut une liste en dur.
import {readdirSync, writeFileSync, existsSync, mkdirSync} from 'node:fs';
import {extname, join} from 'node:path';

const DIR = 'public/charte';
const OUT = 'src/ad/media.ts';
const OK = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

/**
 * Ordre de passage. Un montage ouvre sur du porte — c'est ce qui donne
 * l'echelle et le corps — puis va au produit, puis au detail.
 * Les fichiers de logo sont ecartes : le logo a deja ses propres plans.
 */
const RANK = [
  [/model|porte|lookbook|campagne/i, 0],
  [/hoodie|sweat|tshirt|t-shirt|jacket|veste/i, 1],
  [/jogger|pant|short|gymwear|set/i, 2],
  [/cap|casquette|hat|bob|bag|sac|backpack|accessoire/i, 3],
];
const rankOf = (name) => {
  for (const [re, r] of RANK) if (re.test(name)) return r;
  return 4;
};
const isLogoOnly = (name) => /logo[^/]*transparent|^logo|_logo\./i.test(name);

if (!existsSync(DIR)) mkdirSync(DIR, {recursive: true});

const all = readdirSync(DIR).filter((f) => OK.has(extname(f).toLowerCase()));
const files = all
  .filter((f) => !isLogoOnly(f))
  .sort((a, b) => {
    const d = rankOf(a) - rankOf(b);
    return d !== 0 ? d : a.localeCompare(b, 'fr', {numeric: true});
  });
const skipped = all.filter(isLogoOnly);

const body = `// Genere par \`npm run media\` — ne pas editer a la main.
// Depose les images de la charte dans public/charte/ puis relance la commande.
// L'ordre est celui du montage : porte d'abord, puis produit, puis accessoire.

export const PHOTOS: readonly string[] = [
${files.map((f) => `  'charte/${f}',`).join('\n')}
];

export const HAS_PHOTOS = PHOTOS.length > 0;

/** Photo au rang demande, en bouclant. Null si le dossier est vide. */
export const photoAt = (i: number): string | null =>
  PHOTOS.length === 0 ? null : PHOTOS[((i % PHOTOS.length) + PHOTOS.length) % PHOTOS.length];
`;
writeFileSync(OUT, body);
console.log(`${OUT} — ${files.length} image(s) retenue(s)` +
  (skipped.length ? `, ${skipped.length} fichier(s) de logo ecarte(s)` : ''));
