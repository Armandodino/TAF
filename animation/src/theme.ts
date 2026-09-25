/** Palette et minutage du film. */

export const THEME = {
  ivory: '#F2EFE9',
  ink: '#0B0B0B',
} as const;

export const FPS = 30;

/**
 * Minutage, en images. Tout se joue autour de IMPACT : les pieces convergent
 * en accelerant, se percutent sur une seule image, puis l'image encaisse.
 */
export const BEATS = {
  /** Debut du vol des pieces. */
  flightStart: 0,
  /** Image ou tout se cale. C'est le battement du film. */
  impact: 26,
  /** Micro-decalage entre pieces, en images. Assez court pour rester percu
   *  comme simultane, assez large pour qu'on lise l'assemblage. */
  stagger: 1.6,

  /** Eclair d'impact. */
  flashDuration: 4,
  /** Secousse de camera. */
  shakeDuration: 10,

  /** Balayage de lumiere sur le logo. */
  sheenStart: 44,
  sheenDuration: 14,

  taglineStart: 42,
  taglineDuration: 18,
} as const;

export const TOTAL_FRAMES = 95;
