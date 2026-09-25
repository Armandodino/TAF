import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Series,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {AyokaImpact} from '../AyokaImpact';
import {LogoLayers, ASPECT} from '../logo/LogoLayers';
import {ORDER, PIECES} from '../logo/paths';
import {COPY} from './copy';
import {DISPLAY, LABEL} from './fonts';
import {ChromaText} from './effects/ChromaText';
import {FlashAt, Letterbox} from './effects/Overlays';
import {Plate} from './Plate';

export type SceneProps = {
  background: string;
  ink: string;
  /** Rang du premier plan de la scene dans la suite des photos. */
  from: number;
};

/** Logo fige, sans animation d'assemblage. */
const StillLogo: React.FC<{color: string; width: number}> = ({color, width}) => {
  const transforms = Object.fromEntries(
    ORDER.map((n) => [n, {x: 0, y: 0, rotate: 0, blurX: 0, blurY: 0}]),
  ) as React.ComponentProps<typeof LogoLayers>['transforms'];
  return (
    <div style={{width, height: width / ASPECT}}>
      <LogoLayers transforms={transforms} color={color} uid="still" />
    </div>
  );
};

/* ------------------------------------------------------------------ */

/**
 * Ouverture. Rien, puis un sur-titre qui se stabilise pendant que les barres
 * s'ecartent. Le film ne montre encore aucune image : c'est ce qui donne du
 * poids a la premiere.
 */
export const ColdOpen: React.FC<SceneProps> = ({background, ink}) => {
  const frame = useCurrentFrame();
  const {width, durationInFrames} = useVideoConfig();

  const open = interpolate(frame, [10, 46], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const split = interpolate(frame, [14, 40], [22, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const appear = interpolate(frame, [12, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exit = interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
  });

  return (
    <AbsoluteFill style={{background, alignItems: 'center', justifyContent: 'center'}}>
      <ChromaText
        split={split}
        color={ink}
        style={{
          fontFamily: LABEL,
          fontWeight: 700,
          fontSize: width * 0.036,
          letterSpacing: '0.52em',
          textIndent: '0.52em',
          textTransform: 'uppercase',
          opacity: appear * exit,
        }}
      >
        {COPY.collection}
      </ChromaText>
      <Letterbox height={0.5} open={1 - open} />
      <FlashAt at={durationInFrames - 8} peak={0.5} duration={8} />
    </AbsoluteFill>
  );
};

/**
 * Premiere salve d'images : coupes seches, un eclair sur chaque raccord.
 * Chaque plan vit dans sa propre sequence, sinon son mouvement ne repart pas
 * au raccord et la salve se lit comme un seul plan qui saute.
 */
export const Burst: React.FC<SceneProps & {shots: number; every: number}> = ({
  background,
  ink,
  from,
  shots,
  every,
}) => (
  <AbsoluteFill style={{background}}>
    <Series>
      {Array.from({length: shots}, (_, i) => (
        <Series.Sequence key={i} durationInFrames={every}>
          <Plate
            index={from + i}
            background={background}
            ink={ink}
            motion={i % 2 === 0 ? 'push' : 'pull'}
          />
          <FlashAt at={0} peak={0.42} duration={4} />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);

/**
 * Jalon de milieu de film : le logo surgit d'un coup, net, et tient.
 * L'assemblage complet est garde pour la fin — le jouer deux fois userait
 * l'effet avant le moment ou il compte.
 */
export const LogoStrike: React.FC<SceneProps> = ({background, ink}) => {
  const frame = useCurrentFrame();
  const {fps, width, durationInFrames} = useVideoConfig();
  const punch = spring({frame, fps, config: {damping: 11, mass: 0.5, stiffness: 170}});
  const drift = interpolate(frame, [0, durationInFrames], [0, 0.04]);
  const split = interpolate(frame, [0, 10], [26, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background,
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${interpolate(punch, [0, 1], [1.38, 1]) + drift})`,
      }}
    >
      <div style={{filter: split > 0.5 ? `blur(${split * 0.18}px)` : undefined}}>
        <StillLogo color={ink} width={width * 0.84} />
      </div>
      <FlashAt at={0} peak={0.62} duration={6} />
    </AbsoluteFill>
  );
};

/**
 * Manifeste. Une ligne par plan, en tres grand, sur une image assombrie.
 * Sans texte fourni, le film deroule le nom lettre par lettre : c'est vrai de
 * la marque et ca tient l'ecran sans rien inventer.
 */
export const Manifesto: React.FC<SceneProps & {every: number}> = ({
  background,
  ink,
  from,
  every,
}) => {
  const lines =
    COPY.manifesto.length > 0 ? COPY.manifesto : COPY.brand.split('');
  return (
    <AbsoluteFill style={{background}}>
      <Series>
        {lines.map((line, i) => (
          <Series.Sequence key={i} durationInFrames={every}>
            <ManifestoBeat
              line={line}
              index={from + i}
              background={background}
              ink={ink}
              big={COPY.manifesto.length === 0}
            />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

const ManifestoBeat: React.FC<{
  line: string;
  index: number;
  background: string;
  ink: string;
  big: boolean;
}> = ({line, index, background, ink, big}) => {
  const frame = useCurrentFrame();
  const {fps, width, durationInFrames} = useVideoConfig();

  const rise = spring({frame, fps, config: {damping: 20, mass: 0.6, stiffness: 120}});
  const split = interpolate(frame, [0, 12], [18, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const out = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
  });

  return (
    <AbsoluteFill>
      <Plate index={index} background={background} ink={ink} motion="driftLeft" />
      <AbsoluteFill style={{background: '#000', opacity: 0.55}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <ChromaText
          split={split}
          color="#fff"
          style={{
            fontFamily: DISPLAY,
            fontSize: width * (big ? 0.62 : 0.17),
            lineHeight: 0.92,
            letterSpacing: big ? '-0.02em' : '0.01em',
            textTransform: 'uppercase',
            opacity: out,
            transform: `translateY(${(1 - rise) * width * 0.06}px)`,
          }}
        >
          {line}
        </ChromaText>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Mosaique : les cases tombent une par une, puis l'ensemble se resserre. */
export const Grid: React.FC<SceneProps & {cells: number}> = ({
  background,
  ink,
  from,
  cells,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const close = interpolate(frame, [durationInFrames - 40, durationInFrames], [1, 1.35], {
    extrapolateLeft: 'clamp',
  });

  return (
    <AbsoluteFill style={{background, transform: `scale(${close})`}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
        }}
      >
        {Array.from({length: cells}, (_, i) => {
          const enter = spring({
            frame: frame - i * 6,
            fps,
            config: {damping: 22, mass: 0.5, stiffness: 140},
          });
          return (
            <div key={i} style={{position: 'relative', overflow: 'hidden'}}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  transform: `translateY(${(1 - enter) * 100}%)`,
                }}
              >
                <Plate
                  index={from + i}
                  background={background}
                  ink={ink}
                  motion={i % 2 === 0 ? 'push' : 'driftRight'}
                  amount={0.6}
                />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Plan long, cadre cinema, une legende discrete. */
export const Detail: React.FC<SceneProps> = ({background, ink, from}) => {
  const frame = useCurrentFrame();
  const {width, durationInFrames} = useVideoConfig();
  const label = interpolate(frame, [20, 44], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const out = interpolate(frame, [durationInFrames - 16, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
  });

  return (
    <AbsoluteFill style={{background}}>
      <Plate index={from} background={background} ink={ink} motion="pull" />
      <Letterbox height={0.13} />
      <AbsoluteFill
        style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '19%'}}
      >
        <div
          style={{
            fontFamily: LABEL,
            fontWeight: 500,
            fontSize: width * 0.026,
            letterSpacing: '0.46em',
            textIndent: '0.46em',
            textTransform: 'uppercase',
            color: '#fff',
            opacity: label * out,
            transform: `translateY(${(1 - label) * 18}px)`,
          }}
        >
          {COPY.brand}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Montee : coupes de plus en plus serrees, un mot jete par plan si fourni. */
export const Rapid: React.FC<SceneProps & {shots: number; every: number}> = ({
  background,
  ink,
  from,
  shots,
  every,
}) => (
  <AbsoluteFill style={{background}}>
    <Series>
      {Array.from({length: shots}, (_, i) => (
        <Series.Sequence key={i} durationInFrames={every}>
          <Plate
            index={from + i}
            background={background}
            ink={ink}
            motion={i % 3 === 0 ? 'pull' : i % 3 === 1 ? 'driftLeft' : 'push'}
          />
          {COPY.beats.length > 0 ? (
            <RapidWord word={COPY.beats[i % COPY.beats.length]} />
          ) : null}
          <FlashAt at={0} peak={0.3} duration={3} />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);

const RapidWord: React.FC<{word: string}> = ({word}) => {
  const {width} = useVideoConfig();
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <ChromaText
        split={6}
        color="#fff"
        style={{
          fontFamily: DISPLAY,
          fontSize: width * 0.2,
          textTransform: 'uppercase',
          letterSpacing: '0.01em',
        }}
      >
        {word}
      </ChromaText>
    </AbsoluteFill>
  );
};

/**
 * Le climax : les huit pieces du logo foncent vers le centre et claquent
 * ensemble. C'est l'animation d'assemblage du logo, gardee pour la fin.
 */
export const Finale: React.FC<SceneProps> = ({background, ink}) => (
  <AyokaImpact background={background} ink={ink} tagline="" />
);

/** Generique : le logo se retire, le nom du createur reste. */
export const Credits: React.FC<SceneProps> = ({background, ink}) => {
  const frame = useCurrentFrame();
  const {width, durationInFrames} = useVideoConfig();
  const shrink = interpolate(frame, [0, 26], [0.86, 0.46], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const name = interpolate(frame, [22, 44], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const fade = interpolate(frame, [durationInFrames - 22, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: width * 0.06,
        opacity: fade,
      }}
    >
      <StillLogo color={ink} width={width * shrink} />
      <div
        style={{
          textAlign: 'center',
          opacity: name,
          transform: `translateY(${(1 - name) * 16}px)`,
        }}
      >
        <div
          style={{
            fontFamily: LABEL,
            fontWeight: 500,
            fontSize: width * 0.022,
            letterSpacing: '0.42em',
            textIndent: '0.42em',
            textTransform: 'uppercase',
            color: ink,
            opacity: 0.6,
            marginBottom: width * 0.022,
          }}
        >
          {COPY.signature}
        </div>
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: width * 0.062,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: ink,
          }}
        >
          {COPY.creator}
        </div>
      </div>
    </AbsoluteFill>
  );
};
