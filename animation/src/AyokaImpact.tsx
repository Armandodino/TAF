import React from 'react';
import {
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  ASPECT,
  LogoLayers,
  VIEW_BOX,
  type LogoTransforms,
  type PieceTransform,
} from './logo/LogoLayers';
import {ORDER, PIECES, type PieceName} from './logo/paths';
import {BEATS} from './theme';

export type AyokaImpactProps = {
  background: string;
  ink: string;
  /** Ligne sous le logo, apres l'impact. Vide : le film finit sur le logo seul. */
  tagline: string;
};

/**
 * Par ou arrive chaque piece, et dans quel ordre elle se cale.
 *
 * `ux, uy` est une direction, pas une distance : la distance est calculee au
 * rendu pour que la piece demarre juste en dehors du cadre, quel que soit le
 * format. A distance fixe, une valeur assez grande pour le portrait laisse le
 * carre vide une demi-seconde, et l'inverse fait demarrer les pieces a l'ecran.
 *
 * Chacune vient du cote ou elle vit dans le logo : les oreilles par les flancs,
 * le crane par le haut, la trompe et les defenses par le bas. `order` echelonne
 * les arrivees de quelques images — le crane pose le cadre, la trompe ferme.
 */
const FLIGHT: Record<
  PieceName,
  {ux: number; uy: number; spin: number; order: number}
> = {
  O: {ux: 0, uy: -1, spin: 0, order: 0},
  A1: {ux: -0.99, uy: 0.12, spin: -10, order: 0.5},
  A2: {ux: 0.99, uy: 0.12, spin: 10, order: 0.5},
  Y: {ux: -0.89, uy: 0.44, spin: -5, order: 1},
  K: {ux: 0.89, uy: 0.44, spin: 5, order: 1},
  tusk_L: {ux: -0.42, uy: 0.9, spin: -6, order: 1.5},
  tusk_R: {ux: 0.42, uy: 0.9, spin: 6, order: 1.5},
  trunk: {ux: 0, uy: 1, spin: 0, order: 2},
};

/** La derniere piece a se caler : c'est elle qui donne le battement. */
const LAST_ORDER = Math.max(...Object.values(FLIGHT).map((f) => f.order));

/** Bords du cadre visible, en unites de toile. */
type Frame = {left: number; right: number; top: number; bottom: number};

/**
 * Distance a parcourir dans la direction donnee pour que la piece soit tout
 * juste sortie du cadre. On prend le premier bord franchi, pas le plus loin.
 */
const exitDistance = (
  bbox: readonly [number, number, number, number],
  ux: number,
  uy: number,
  frame: Frame,
) => {
  const [x0, y0, x1, y1] = bbox;
  const options: number[] = [];
  if (ux < 0) options.push((x1 - frame.left) / -ux);
  if (ux > 0) options.push((frame.right - x0) / ux);
  if (uy < 0) options.push((y1 - frame.top) / -uy);
  if (uy > 0) options.push((frame.bottom - y0) / uy);
  return Math.min(...options) * 1.06;
};

/** Depart retenu, arrivee lancee : la piece est a sa vitesse maximale quand
 *  elle se cale. C'est ce qui fait le coup, plutot qu'un atterrissage. */
const FLIGHT_EASE = Easing.bezier(0.24, 0, 0.72, 0.24);

/** Le flou suit la vitesse. Plafonne, sinon la trainee mange le cadre. */
const BLUR_GAIN = 0.3;
const BLUR_CEILING = 34;

/** L'image ou le film bascule : la derniere piece vient de se caler. */
const IMPACT = BEATS.impact + BEATS.stagger * LAST_ORDER;

/** Avancee du vol d'une piece : 1 = hors cadre, 0 = en place. */
const flightAt = (frame: number, order: number) => {
  const shift = order * BEATS.stagger;
  return interpolate(
    frame,
    [BEATS.flightStart + shift, BEATS.impact + shift],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: FLIGHT_EASE},
  );
};

const transformsAt = (frame: number, bounds: Frame): LogoTransforms => {
  const out = {} as LogoTransforms;
  for (const name of ORDER) {
    const {ux, uy, spin, order} = FLIGHT[name];
    const distance = exitDistance(PIECES[name].bbox, ux, uy, bounds);
    const dx = ux * distance;
    const dy = uy * distance;
    const now = flightAt(frame, order);
    const speed = now - flightAt(frame - 1, order);
    out[name] = {
      x: dx * now,
      y: dy * now,
      rotate: spin * now,
      blurX: Math.min(Math.abs(dx * speed) * BLUR_GAIN, BLUR_CEILING),
      blurY: Math.min(Math.abs(dy * speed) * BLUR_GAIN, BLUR_CEILING),
    } satisfies PieceTransform;
  }
  return out;
};

export const AyokaImpact: React.FC<AyokaImpactProps> = ({
  background,
  ink,
  tagline,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();

  const ratio = width / height;
  const portrait = ratio < 0.8;
  const logoWidth = width * (portrait ? 0.82 : ratio > 1.25 ? 0.46 : 0.7);

  // le cadre visible, exprime dans les unites du trace
  const perPixel = VIEW_BOX.width / logoWidth;
  const midX = VIEW_BOX.x + VIEW_BOX.width / 2;
  const midY = VIEW_BOX.y + VIEW_BOX.height / 2;
  const bounds: Frame = {
    left: midX - (width / 2) * perPixel,
    right: midX + (width / 2) * perPixel,
    top: midY - (height / 2) * perPixel,
    bottom: midY + (height / 2) * perPixel,
  };

  // le cadre est tenu large pendant le vol, puis se resserre en passant
  // sous sa taille au moment du choc : c'est le logo qui encaisse
  const recoil = spring({
    frame: frame - IMPACT,
    fps,
    config: {damping: 9, mass: 0.42, stiffness: 190},
  });
  const push = interpolate(frame, [IMPACT, durationInFrames], [0, 0.022], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(recoil, [0, 1], [1.11, 1]) + push;

  // secousse de camera, amortie au carre
  const shaken = (frame - IMPACT) / BEATS.shakeDuration;
  const amplitude = shaken >= 0 && shaken <= 1 ? (1 - shaken) ** 2 * 18 : 0;
  const shakeX = (random(`x${frame}`) - 0.5) * 2 * amplitude;
  const shakeY = (random(`y${frame}`) - 0.5) * 2 * amplitude;

  const flash = interpolate(
    frame,
    [IMPACT - 1, IMPACT, IMPACT + BEATS.flashDuration],
    [0, 0.45, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      // chute franche : un eclair qui traine ressemble a un fondu rate
      easing: Easing.out(Easing.cubic),
    },
  );

  const sheenEnd = BEATS.sheenStart + BEATS.sheenDuration;
  const sheen =
    frame < BEATS.sheenStart || frame > sheenEnd
      ? -1
      : interpolate(frame, [BEATS.sheenStart, sheenEnd], [0, 1], {
          easing: Easing.bezier(0.3, 0, 0.2, 1),
        });

  const taglineIn = interpolate(
    frame,
    [BEATS.taglineStart, BEATS.taglineStart + BEATS.taglineDuration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    },
  );

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: height * 0.04,
          transform: `translate(${shakeX}px, ${shakeY}px) scale(${scale})`,
        }}
      >
        <div style={{width: logoWidth, height: logoWidth / ASPECT}}>
          <LogoLayers
            transforms={transformsAt(frame, bounds)}
            color={ink}
            uid="ayoka"
            sheen={sheen}
          />
        </div>

        {tagline ? (
          <div
            style={{
              fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
              fontSize: width * (portrait ? 0.028 : 0.022),
              fontWeight: 600,
              letterSpacing: '0.44em',
              // le pas de lettrage pousse le texte a droite : on le recentre
              textIndent: '0.44em',
              textTransform: 'uppercase',
              color: ink,
              opacity: taglineIn,
              transform: `translateY(${(1 - taglineIn) * 12}px)`,
            }}
          >
            {tagline}
          </div>
        ) : null}
      </div>

      {/* eclair de choc */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#fff',
          opacity: flash,
          pointerEvents: 'none',
        }}
      />

      {/* grain : la seed ne change qu'une image sur deux, sinon ca grouille */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.055,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      >
        <filter id="ayoka-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves={2}
            seed={Math.floor(frame / 2)}
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#ayoka-grain)" />
      </svg>

      {/* vignettage, pour que l'aplat ne paraisse pas plat */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(120% 90% at 50% 45%, transparent 52%, #000 160%)`,
          opacity: 0.18,
        }}
      />
    </div>
  );
};
