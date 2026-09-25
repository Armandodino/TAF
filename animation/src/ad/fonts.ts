import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

/**
 * Polices servies depuis public/fonts, pas depuis Google Fonts.
 *
 * Le chargement distant ajoute une dependance reseau au rendu : si l'hote ne
 * joint pas fonts.gstatic.com, le rendu s'arrete au lieu de retomber sur une
 * police de remplacement. Les fichiers viennent de @fontsource et sont copies
 * dans public/ — le rendu est identique partout, hors ligne compris.
 */

/** Grotesque condensee : la voix des affiches de sport. Pour les titres. */
export const DISPLAY = 'Anton, Impact, Haettenschweiler, sans-serif';

/** Pour les sur-titres et le generique, en lettrage espace. */
export const LABEL = 'Archivo, Helvetica Neue, Arial, sans-serif';

export const fontsReady = Promise.all([
  loadFont({family: 'Anton', url: staticFile('fonts/anton-400.woff2'), weight: '400'}),
  loadFont({family: 'Archivo', url: staticFile('fonts/archivo-500.woff2'), weight: '500'}),
  loadFont({family: 'Archivo', url: staticFile('fonts/archivo-700.woff2'), weight: '700'}),
]);
