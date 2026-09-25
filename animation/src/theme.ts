/** Palette et rythme de l'animation, partages par les compositions. */

export const THEME = {
  ivory: '#F2EFE9',
  ink: '#111111',
} as const;

export const FPS = 30;

/**
 * Minutage, en images. Le logo se construit dans l'ordre ou l'oeil le lit :
 * le mot d'abord, puis ce qui fait l'elephant.
 */
export const BEATS = {
  letterStart: 6,
  letterStagger: 7,
  letterDuration: 22,

  tuskStart: 54,
  tuskStagger: 5,
  tuskDuration: 20,

  trunkStart: 64,
  trunkDuration: 32,

  ruleStart: 98,
  ruleDuration: 26,

  taglineStart: 114,
  taglineDuration: 22,
} as const;

export const TOTAL_FRAMES = 150;
