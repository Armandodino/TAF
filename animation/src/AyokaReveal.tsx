import React from 'react';
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {ASPECT, LogoLayers, type LogoStates} from './logo/LogoLayers';
import {LETTERS, ORDER, type PieceName} from './logo/paths';
import {BEATS} from './theme';

export type AyokaRevealProps = {
  background: string;
  ink: string;
  /** Ligne sous le logo. Laisser vide pour finir sur le logo seul. */
  tagline: string;
};

const EASE = Easing.out(Easing.cubic);

/** Progression d'un volet, de 0 a 1. */
const openAt = (frame: number, start: number, duration: number) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });

/** Glissement d'une piece vers sa place, amorti sans rebond visible. */
const slideAt = (
  frame: number,
  fps: number,
  start: number,
  distance: number,
) =>
  interpolate(
    spring({
      frame: frame - start,
      fps,
      config: {damping: 18, mass: 0.7, stiffness: 95},
    }),
    [0, 1],
    [distance, 0],
  );

/** Legere bascule d'entree, plus marquee sur les pieces exterieures. */
const TILT: Partial<Record<PieceName, number>> = {
  A1: -1.6,
  Y: -0.7,
  K: 0.7,
  A2: 1.6,
};

const useLogoStates = (frame: number, fps: number): LogoStates => {
  const states = {} as LogoStates;

  LETTERS.forEach((name, i) => {
    const start = BEATS.letterStart + i * BEATS.letterStagger;
    const settled = openAt(frame, start, BEATS.letterDuration);
    states[name] = {
      reveal: settled,
      from: 'bottom',
      dy: slideAt(frame, fps, start, 74),
      rotate: (TILT[name] ?? 0) * (1 - settled),
    };
  });

  (['tusk_L', 'tusk_R'] as const).forEach((name, i) => {
    const start = BEATS.tuskStart + i * BEATS.tuskStagger;
    states[name] = {
      reveal: openAt(frame, start, BEATS.tuskDuration),
      from: 'top',
      dy: slideAt(frame, fps, start, -34),
    };
  });

  states.trunk = {
    reveal: openAt(frame, BEATS.trunkStart, BEATS.trunkDuration),
    from: 'top',
    dy: slideAt(frame, fps, BEATS.trunkStart, -46),
  };

  return states;
};

export const AyokaReveal: React.FC<AyokaRevealProps> = ({
  background,
  ink,
  tagline,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const ratio = width / height;
  const portrait = ratio < 0.8;
  // le logo est large : en paysage il doit respirer, en portrait il peut remplir
  const widthFactor = portrait ? 0.82 : ratio > 1.25 ? 0.46 : 0.7;

  const states = useLogoStates(frame, fps);

  // le logo se pose, puis un rapproche tres lent court jusqu'a la fin :
  // l'image respire au lieu de se figer des la derniere piece posee
  const settle = spring({
    frame,
    fps,
    config: {damping: 200, mass: 1.6, stiffness: 55},
  });
  const push = interpolate(frame, [0, durationInFrames], [0, 0.016], {
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(settle, [0, 1], [1.045, 1]) + push;

  const logoWidth = width * widthFactor;
  const rule = openAt(frame, BEATS.ruleStart, BEATS.ruleDuration);
  const taglineIn = openAt(frame, BEATS.taglineStart, BEATS.taglineDuration);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: portrait ? height * 0.035 : height * 0.045,
      }}
    >
      <div
        style={{
          width: logoWidth,
          height: logoWidth / ASPECT,
          transform: `scale(${scale})`,
        }}
      >
        <LogoLayers states={states} color={ink} uid="ayoka" />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: height * 0.022,
        }}
      >
        <div
          style={{
            width: logoWidth * 0.5 * rule,
            height: 2,
            background: ink,
            opacity: 0.85,
          }}
        />
        {tagline ? (
          <div
            style={{
              fontFamily:
                'Helvetica Neue, Helvetica, Arial, sans-serif',
              fontSize: width * (portrait ? 0.03 : 0.024),
              letterSpacing: '0.42em',
              // le pas de lettrage decale le texte : on le recentre
              textIndent: '0.42em',
              textTransform: 'uppercase',
              color: ink,
              opacity: taglineIn,
              transform: `translateY(${(1 - taglineIn) * 14}px)`,
            }}
          >
            {tagline}
          </div>
        ) : null}
      </div>

      {/* vignettage tres leger, pour que l'aplat ne paraisse pas plat */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(120% 90% at 50% 45%, transparent 55%, ${ink} 160%)`,
          opacity: 0.07,
        }}
      />
    </div>
  );
};

export {ORDER};
