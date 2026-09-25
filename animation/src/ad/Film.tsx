import React from 'react';
import {AbsoluteFill} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {AyokaImpact} from '../AyokaImpact';
import {THEME} from '../theme';
import './fonts';
import {Credits} from './Ending';
import {Grain, Vignette} from './effects/Overlays';
import {flip3D, irisWipe, sliceGlitch, whipPan, zoomPunch} from './transitions';
import {Carousel, Duo, Hero, Reveal, Wall} from './showcase';

/** Duree de chaque scene, en images. */
const CUTS = {
  reveal: 140,
  heroA: 215,
  heroB: 215,
  heroC: 205,
  duo: 215,
  carousel: 275,
  wall: 245,
  logo: 250,
  credits: 152,
} as const;

/** Duree de chaque raccord. Un raccord mange du temps aux deux scenes qu'il
 *  relie : il se retranche du total. */
const LAPS = {
  toHeroA: 14,
  toHeroB: 16,
  toHeroC: 14,
  toDuo: 12,
  toCarousel: 14,
  toWall: 14,
  toLogo: 12,
  toCredits: 16,
} as const;

const total = (o: Record<string, number>) =>
  Object.values(o).reduce((a, b) => a + b, 0);

export const FILM_FRAMES = total(CUTS) - total(LAPS);

/**
 * Rang des pieces dans le film. Le hoodie ouvre parce que c'est la piece la
 * plus colorée du lot ; les accessoires ferment la presentation avant le
 * defile, qui les reprend tous.
 */
const CAST = {reveal: 2, heroA: 2, heroB: 3, heroC: 4, duo: 0, run: 0} as const;

export type FilmProps = {
  background: string;
  ink: string;
};

export const AyokaFilm: React.FC<FilmProps> = ({background, ink}) => {
  const lap = (frames: number) => linearTiming({durationInFrames: frames});

  return (
    <AbsoluteFill style={{background: '#0B0B0B'}}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={CUTS.reveal}>
          <Reveal index={CAST.reveal} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={irisWipe()}
          timing={lap(LAPS.toHeroA)}
        />
        <TransitionSeries.Sequence durationInFrames={CUTS.heroA}>
          <Hero index={CAST.heroA} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={flip3D()}
          timing={lap(LAPS.toHeroB)}
        />
        <TransitionSeries.Sequence durationInFrames={CUTS.heroB}>
          <Hero index={CAST.heroB} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={whipPan('x', 1)}
          timing={lap(LAPS.toHeroC)}
        />
        <TransitionSeries.Sequence durationInFrames={CUTS.heroC}>
          <Hero index={CAST.heroC} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={zoomPunch()}
          timing={lap(LAPS.toDuo)}
        />
        <TransitionSeries.Sequence durationInFrames={CUTS.duo}>
          <Duo index={CAST.duo} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={sliceGlitch(11)}
          timing={lap(LAPS.toCarousel)}
        />
        <TransitionSeries.Sequence durationInFrames={CUTS.carousel}>
          <Carousel index={CAST.run} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={whipPan('y', -1)}
          timing={lap(LAPS.toWall)}
        />
        <TransitionSeries.Sequence durationInFrames={CUTS.wall}>
          <Wall index={CAST.run} />
        </TransitionSeries.Sequence>

        {/* le logo n'apparait qu'ici : tout le film avant lui est le produit */}
        <TransitionSeries.Transition
          presentation={zoomPunch()}
          timing={lap(LAPS.toLogo)}
        />
        <TransitionSeries.Sequence durationInFrames={CUTS.logo}>
          <AyokaImpact background={background} ink={ink} tagline="" />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={lap(LAPS.toCredits)}
        />
        <TransitionSeries.Sequence durationInFrames={CUTS.credits}>
          <Credits background={background} ink={ink} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* deux couches tenues d'un bout a l'autre : sans elles, le montage se
          lit comme une suite de plans et non comme un seul film */}
      <Grain opacity={0.06} />
      <Vignette strength={0.3} />
    </AbsoluteFill>
  );
};

export {THEME};
