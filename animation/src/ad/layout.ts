import {useVideoConfig} from 'remotion';

/**
 * Mesures communes a toutes les scenes.
 *
 * Les tailles se calent sur le petit cote, pas sur la largeur : une taille
 * exprimee en fraction de largeur donne un texte juste en portrait et un
 * texte qui deborde de la hauteur en paysage. Le petit cote est la seule
 * mesure qui se comporte pareil dans les deux sens.
 */
export const useLayout = () => {
  const {width, height} = useVideoConfig();
  const ratio = width / height;
  const u = Math.min(width, height);
  return {
    width,
    height,
    ratio,
    /** Unite de base : le petit cote du cadre. */
    u,
    portrait: ratio < 0.8,
    wide: ratio > 1.25,
    /** Largeur du logo, le logo etant tres large. */
    logoWidth: width * (ratio < 0.8 ? 0.82 : ratio > 1.25 ? 0.46 : 0.7),
    /** Colonnes de la mosaique : deux en portrait, trois en paysage. */
    columns: ratio > 1.25 ? 3 : 2,
  };
};
