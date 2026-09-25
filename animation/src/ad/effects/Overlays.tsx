import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';

/**
 * Grain argentique. La graine ne change qu'une image sur deux : a chaque
 * image le bruit grouille et mange le debit du fichier.
 */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.07}) => {
  const frame = useCurrentFrame();
  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity,
        mixBlendMode: 'overlay',
        pointerEvents: 'none',
      }}
    >
      <filter id="film-grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.82"
          numOctaves={2}
          seed={Math.floor(frame / 2)}
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#film-grain)" />
    </svg>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.4}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background:
        'radial-gradient(115% 85% at 50% 48%, transparent 45%, #000 135%)',
      opacity: strength,
    }}
  />
);

/** Barres cinema. `open` va de 0 (fermees) a 1 (grandes ouvertes). */
export const Letterbox: React.FC<{height?: number; open?: number}> = ({
  height = 0.11,
  open = 1,
}) => {
  const bar = `${height * 100 * open}%`;
  const common = {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    height: bar,
    background: '#000',
    pointerEvents: 'none' as const,
  };
  return (
    <>
      <div style={{...common, top: 0}} />
      <div style={{...common, bottom: 0}} />
    </>
  );
};

/** Eclair blanc bref, cale sur une image precise de la scene. */
export const FlashAt: React.FC<{at: number; duration?: number; peak?: number}> = ({
  at,
  duration = 5,
  peak = 0.55,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [at - 1, at, at + duration], [0, peak, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (opacity <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#fff',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};
