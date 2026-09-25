import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from '@remotion/transitions';

/**
 * Transitions maison. Les presets livres avec Remotion sont des fondus et des
 * glissements propres ; un montage court a besoin de coupes qui se voient.
 */

type WhipProps = {axis: 'x' | 'y'; sign: 1 | -1};

/**
 * Filage : le plan sortant part a toute vitesse, le plan entrant arrive du
 * meme cote. Le flou monte au milieu de la transition et retombe — c'est lui
 * qui vend le coup de poignet, pas le deplacement.
 */
const WhipPan: React.FC<TransitionPresentationComponentProps<WhipProps>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps: {axis, sign},
}) => {
  const leaving = presentationDirection === 'exiting';
  const shift = leaving ? -p * 118 * sign : (1 - p) * 118 * sign;
  const blur = interpolate(p, [0, 0.5, 1], [0, 26, 0]);
  return React.createElement(
    AbsoluteFill,
    {
      style: {
        transform:
          axis === 'x' ? `translateX(${shift}%)` : `translateY(${shift}%)`,
        filter: `blur(${blur}px)`,
      },
    },
    children,
  );
};

export const whipPan = (
  axis: 'x' | 'y' = 'x',
  sign: 1 | -1 = 1,
): TransitionPresentation<WhipProps> => ({
  component: WhipPan,
  props: {axis, sign},
});

/** Coup de zoom : le plan sortant fonce sur l'objectif, l'entrant recule. */
const ZoomPunch: React.FC<TransitionPresentationComponentProps<{}>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
}) => {
  const leaving = presentationDirection === 'exiting';
  const scale = leaving ? 1 + p * 0.55 : interpolate(p, [0, 1], [0.66, 1]);
  const opacity = leaving ? 1 - p : Math.min(1, p * 2.2);
  return React.createElement(
    AbsoluteFill,
    {style: {transform: `scale(${scale})`, opacity}},
    children,
  );
};

export const zoomPunch = (): TransitionPresentation<{}> => ({
  component: ZoomPunch,
  props: {},
});

type SliceProps = {count: number};

/**
 * Deraillement : l'image est coupee en bandes qui partent chacune de leur cote
 * avant de se remettre en ligne. Le decalage est tire du rang de la bande,
 * pas du hasard : il reste identique d'un rendu a l'autre.
 */
const SliceGlitch: React.FC<TransitionPresentationComponentProps<SliceProps>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps: {count},
}) => {
  const leaving = presentationDirection === 'exiting';
  const force = interpolate(p, [0, 0.45, 1], [0, 1, 0]);
  const bands = Array.from({length: count}, (_, i) => {
    const dir = i % 2 === 0 ? 1 : -1;
    const spread = (0.35 + ((i * 37) % 100) / 140) * dir;
    return React.createElement(
      'div',
      {
        key: i,
        style: {
          position: 'absolute' as const,
          top: `${(i / count) * 100}%`,
          left: 0,
          right: 0,
          height: `${100 / count + 0.4}%`,
          overflow: 'hidden',
          transform: `translateX(${force * spread * 60}%)`,
        },
      },
      // L'interieur porte l'image entiere, remontee pour que la bande n'en
      // laisse voir que sa tranche. Le decalage se compte en hauteurs de
      // bande, pas en pourcentage d'ecran : le parent ici est la bande, et
      // un pourcentage d'ecran y vaut count fois moins — l'image se repetait
      // alors en escalier au lieu d'etre tranchee.
      React.createElement(
        'div',
        {
          style: {
            position: 'absolute' as const,
            top: `${-i * 100}%`,
            left: 0,
            right: 0,
            height: `${count * 100}%`,
          },
        },
        children,
      ),
    );
  });
  return React.createElement(
    AbsoluteFill,
    {style: {opacity: leaving ? 1 - p * 0.9 : Math.min(1, p * 2)}},
    bands,
  );
};

export const sliceGlitch = (count = 9): TransitionPresentation<SliceProps> => ({
  component: SliceGlitch,
  props: {count},
});
