import React from 'react';
import {AbsoluteFill} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {THEME} from '../theme';
import './fonts';
import {Grain, Vignette} from './effects/Overlays';
import {sliceGlitch, whipPan, zoomPunch} from './transitions';
import {
  Burst,
  ColdOpen,
  Credits,
  Detail,
  Finale,
  Grid,
  LogoStrike,
  Manifesto,
  Rapid,
} from './scenes';

/** Duree de chaque scene, en images. */
const CUTS = {
  coldOpen: 100,
  burst: 200,
  strike: 130,
  manifesto: 320,
  grid: 290,
  detail: 260,
  rapid: 260,
  finale: 200,
  credits: 136,
} as const;

/** Duree de chaque raccord. Une transition mange du temps aux deux scenes
 *  qu'elle relie : elle se retranche du total. */
const LAPS = {
  toBurst: 12,
  toStrike: 10,
  toManifesto: 12,
  toGrid: 12,
  toDetail: 10,
  toRapid: 12,
  toFinale: 10,
  toCredits: 18,
} as const;

const total = (o: Record<string, number>) =>
  Object.values(o).reduce((a, b) => a + b, 0);

export const FILM_FRAMES = total(CUTS) - total(LAPS);

/** Rang du premier plan de chaque scene dans la suite des photos. */
const FROM = {
  burst: 0,
  manifesto: 5,
  grid: 10,
  detail: 14,
  rapid: 15,
} as const;

export type FilmProps = {
  background: string;
  ink: string;
};

export const AyokaFilm: React.FC<FilmProps> = ({background, ink}) => {
  const dark = {background: THEME.ink, ink: THEME.ivory};
  const light = {background, ink};
  const lap = (frames: number) => linearTiming({durationInFrames: frames});

  return (
    <AbsoluteFill style={{background}}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={CUTS.coldOpen}>
          <ColdOpen {...dark} from={0} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={whipPan('x', 1)}
          timing={lap(LAPS.toBurst)}
        />
        <TransitionSeries.Sequence durationInFrames={CUTS.burst}>
          <Burst {...dark} from={FROM.burst} shots={5} every={40} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={zoomPunch()}
          timing={lap(LAPS.toStrike)}
        />
        <TransitionSeries.Sequence durationInFrames={CUTS.strike}>
          <LogoStrike {...light} from={0} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={sliceGlitch(9)}
          timing={lap(LAPS.toManifesto)}
        />
        <TransitionSeries.Sequence durationInFrames={CUTS.manifesto}>
          <Manifesto {...dark} from={FROM.manifesto} every={64} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={whipPan('y', -1)}
          timing={lap(LAPS.toGrid)}
        />
        <TransitionSeries.Sequence durationInFrames={CUTS.grid}>
          <Grid {...dark} from={FROM.grid} rows={2} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={zoomPunch()}
          timing={lap(LAPS.toDetail)}
        />
        <TransitionSeries.Sequence durationInFrames={CUTS.detail}>
          <Detail {...dark} from={FROM.detail} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={sliceGlitch(13)}
          timing={lap(LAPS.toRapid)}
        />
        <TransitionSeries.Sequence durationInFrames={CUTS.rapid}>
          <Rapid {...dark} from={FROM.rapid} shots={20} every={13} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={whipPan('x', -1)}
          timing={lap(LAPS.toFinale)}
        />
        <TransitionSeries.Sequence durationInFrames={CUTS.finale}>
          <Finale {...light} from={0} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={lap(LAPS.toCredits)}
        />
        <TransitionSeries.Sequence durationInFrames={CUTS.credits}>
          <Credits {...light} from={0} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* deux couches tenues d'un bout a l'autre : sans elles, le montage se
          lit comme une suite de plans et non comme un seul film */}
      <Grain opacity={0.07} />
      <Vignette strength={0.34} />
    </AbsoluteFill>
  );
};
