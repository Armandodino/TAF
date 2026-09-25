import React from 'react';
import {Composition} from 'remotion';
import {AyokaImpact, type AyokaImpactProps} from './AyokaImpact';
import {AyokaFilm, FILM_FRAMES, type FilmProps} from './ad/Film';
import {FPS, THEME, TOTAL_FRAMES} from './theme';

/**
 * Trois formats du meme film. Pour changer la ligne sous le logo ou inverser
 * les couleurs, il suffit de toucher aux defaultProps ci-dessous.
 */
export const RemotionRoot: React.FC = () => {
  const common = {
    component: AyokaImpact,
    durationInFrames: TOTAL_FRAMES,
    fps: FPS,
  } as const;

  const light: AyokaImpactProps = {
    background: THEME.ivory,
    ink: THEME.ink,
    tagline: '',
  };
  const dark: AyokaImpactProps = {
    background: THEME.ink,
    ink: THEME.ivory,
    tagline: '',
  };

  return (
    <>
      {/* post carre */}
      <Composition
        {...common}
        id="AyokaSquare"
        width={1080}
        height={1080}
        defaultProps={light}
      />
      {/* reel et story */}
      <Composition
        {...common}
        id="AyokaReel"
        width={1080}
        height={1920}
        defaultProps={dark}
      />
      {/* la pub : une minute. Horizontal d'abord, vertical pour les reseaux */}
      <Composition
        id="AyokaFilm"
        component={AyokaFilm}
        durationInFrames={FILM_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{background: THEME.ivory, ink: THEME.ink} satisfies FilmProps}
      />
      <Composition
        id="AyokaFilmVertical"
        component={AyokaFilm}
        durationInFrames={FILM_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{background: THEME.ivory, ink: THEME.ink} satisfies FilmProps}
      />
      {/* banniere de site, en-tete de video */}
      <Composition
        {...common}
        id="AyokaBanner"
        width={1920}
        height={1080}
        defaultProps={light}
      />
    </>
  );
};
