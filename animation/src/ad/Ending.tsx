import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ASPECT, LogoLayers} from '../logo/LogoLayers';
import {ORDER} from '../logo/paths';
import {COPY} from './copy';
import {DISPLAY, LABEL} from './fonts';
import {useLayout} from './layout';

/** Logo fige, sans animation d'assemblage. */
export const StillLogo: React.FC<{color: string; width: number}> = ({
  color,
  width,
}) => {
  const transforms = Object.fromEntries(
    ORDER.map((n) => [n, {x: 0, y: 0, rotate: 0, blurX: 0, blurY: 0}]),
  ) as React.ComponentProps<typeof LogoLayers>['transforms'];
  return (
    <div style={{width, height: width / ASPECT}}>
      <LogoLayers transforms={transforms} color={color} uid="still" />
    </div>
  );
};

/** Generique : le logo se retire, le nom du createur reste. */
export const Credits: React.FC<{background: string; ink: string}> = ({
  background,
  ink,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const {u, logoWidth} = useLayout();

  const shrink = interpolate(frame, [0, 26], [1, 0.62], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const name = interpolate(frame, [22, 46], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const fade = interpolate(
    frame,
    [durationInFrames - 24, durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp'},
  );

  const line: React.CSSProperties = {
    fontFamily: LABEL,
    fontWeight: 500,
    letterSpacing: '0.42em',
    textIndent: '0.42em',
    textTransform: 'uppercase',
    color: ink,
    opacity: 0.6,
  };

  return (
    <AbsoluteFill
      style={{
        background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: u * 0.06,
        opacity: fade,
      }}
    >
      <StillLogo color={ink} width={logoWidth * shrink} />
      <div
        style={{
          textAlign: 'center',
          opacity: name,
          transform: `translateY(${(1 - name) * 16}px)`,
        }}
      >
        <div style={{...line, fontSize: u * 0.022, marginBottom: u * 0.022}}>
          {COPY.signature}
        </div>
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: u * 0.062,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: ink,
          }}
        >
          {COPY.creator}
        </div>
        <div style={{...line, fontSize: u * 0.024, marginTop: u * 0.018}}>
          {COPY.forWhom}
        </div>
      </div>
    </AbsoluteFill>
  );
};
