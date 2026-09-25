/**
 * Tous les textes du film, en un seul endroit.
 *
 * Les valeurs livrees ne disent que ce qui est vrai de la marque : son nom et
 * son createur. `manifesto` et `beats` sont vides — remplis-les avec tes
 * propres mots et les scenes correspondantes s'y adaptent toutes seules.
 */
export const COPY = {
  brand: 'AYOKA',
  creator: 'Armando Anzan',
  /** Sur-titre du carton d'ouverture et du generique. */
  collection: 'Collection 01',

  /**
   * Lignes du manifeste, une par plan. Vide : le film deroule le nom lettre
   * par lettre a la place, ce qui tient tout seul.
   */
  manifesto: [] as string[],

  /** Mots jetes pendant le montage rapide. Vide : le montage reste muet. */
  beats: [] as string[],

  /** Derniere ligne, sous le logo. */
  signature: 'Une création de',
} as const;
