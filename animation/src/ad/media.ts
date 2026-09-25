// Genere par `npm run media` — ne pas editer a la main.
// Depose les images de la charte dans public/charte/ puis relance la commande.
// L'ordre est celui du montage : porte d'abord, puis produit, puis accessoire.

export const PHOTOS: readonly string[] = [

];

export const HAS_PHOTOS = PHOTOS.length > 0;

/** Photo au rang demande, en bouclant. Null si le dossier est vide. */
export const photoAt = (i: number): string | null =>
  PHOTOS.length === 0 ? null : PHOTOS[((i % PHOTOS.length) + PHOTOS.length) % PHOTOS.length];
