import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {VIEW_BOX} from '../logo/LogoLayers';
import {PIECES, type PieceName} from '../logo/paths';
import {DISPLAY, LABEL} from './fonts';
import {useLayout} from './layout';
import {ProductView} from './Product';
import {productAt} from './products';

/** Les cinq lettres du mot. */
export const WORD: PieceName[] = ['A1', 'Y', 'O', 'K', 'A2'];
/** Ce qui fait l'animal : le crane, la trompe, les defenses. */
export const BEAST: PieceName[] = ['O', 'trunk', 'tusk_L', 'tusk_R'];

/**
 * Une partie du logo seulement.
 *
 * Le decoupage en pieces sert ici le recit : le film montre d'abord le mot,
 * puis l'animal, avant de les reunir — ce que le logo fait en une seule forme.
 */
export const LogoSubset: React.FC<{
  parts: readonly PieceName[];
  color: string;
  width: number;
  /** Progression d'apparition, de 0 a 1, piece par piece. */
  reveal?: number;
  opacity?: number;
}> = ({parts, color, width, reveal = 1, opacity = 1}) => (
  <svg
    viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.width} ${VIEW_BOX.height}`}
    style={{width, height: width / (VIEW_BOX.width / VIEW_BOX.height), opacity}}
  >
    {parts.map((name, i) => {
      const step = parts.length === 0 ? 1 : 1 / parts.length;
      const local = Math.max(0, Math.min(1, (reveal - i * step * 0.7) / step));
      const [px, py] = PIECES[name].pivot;
      return (
        <g
          key={name}
          opacity={local}
          transform={`translate(0 ${(1 - local) * 70}) rotate(${(1 - local) * -6} ${px} ${py})`}
        >
          <path d={PIECES[name].d} fill={color} fillRule="evenodd" />
        </g>
      );
    })}
  </svg>
);

/** Mot pose a l'ecran, en grandes capitales. */
export const StoryText: React.FC<{
  text: string;
  color: string;
  show: number;
  size?: number;
  tracking?: string;
}> = ({text, color, show, size = 0.1, tracking = '0.06em'}) => {
  const {u} = useLayout();
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: u * size,
          letterSpacing: tracking,
          textTransform: 'uppercase',
          color,
          opacity: show,
          transform: `translateY(${(1 - show) * u * 0.02}px) scale(${0.96 + show * 0.04})`,
          textAlign: 'center',
          lineHeight: 1.05,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

/** Entree commune : le plan s'ouvre vite, se retire doucement. */
const useBeat = (holdOut = 10) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const inn = spring({frame, fps, config: {damping: 24, mass: 0.8, stiffness: 110}});
  const out = interpolate(
    frame,
    [durationInFrames - holdOut, durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp'},
  );
  return {frame, inn, out, durationInFrames};
};

/* ------------------------------------------------------------------ */

/**
 * Ouverture. Presque rien : une matiere qui respire dans le noir. Le film
 * doit commencer plus bas que la voix pour qu'elle ait de la place.
 */
export const DarkMatter: React.FC<{index: number; tint?: string}> = ({
  index,
  tint = '#D84800',
}) => {
  const {frame, out, durationInFrames} = useBeat(14);
  const p = productAt(index);
  const zoom = interpolate(frame, [0, durationInFrames], [1.5, 1.14]);
  const lift = interpolate(frame, [0, durationInFrames], [0.06, -0.04]);
  const glow = interpolate(frame, [0, durationInFrames * 0.6], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{background: '#050505', opacity: out}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(48% 48% at 50% 48%, ${tint}2E 0%, transparent 72%)`,
          opacity: glow,
        }}
      />
      <ProductView
        product={p}
        size={0.92 * zoom}
        y={lift}
        rotateY={interpolate(frame, [0, durationInFrames], [-7, 7])}
        shadow={0}
        opacity={interpolate(glow, [0, 1], [0.12, 0.42])}
        blur={interpolate(frame, [0, durationInFrames], [7, 1.5])}
      />
    </AbsoluteFill>
  );
};

/** Le mot seul, ou l'animal seul, selon les pieces qu'on lui donne. */
export const HalfLogo: React.FC<{
  parts: readonly PieceName[];
  label?: string;
  background?: string;
  ink?: string;
}> = ({parts, label, background = '#070707', ink = '#F2EFE9'}) => {
  const {frame, inn, out, durationInFrames} = useBeat(12);
  const {u, logoWidth} = useLayout();
  const reveal = interpolate(frame, [4, durationInFrames * 0.62], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const push = interpolate(frame, [0, durationInFrames], [0, 0.04]);

  return (
    <AbsoluteFill
      style={{
        background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: u * 0.05,
        opacity: out,
        transform: `scale(${interpolate(inn, [0, 1], [1.1, 1]) + push})`,
      }}
    >
      <LogoSubset parts={parts} color={ink} width={logoWidth} reveal={reveal} />
      {label ? (
        <div
          style={{
            fontFamily: LABEL,
            fontWeight: 700,
            fontSize: u * 0.026,
            letterSpacing: '0.5em',
            textIndent: '0.5em',
            textTransform: 'uppercase',
            color: ink,
            opacity: interpolate(frame, [14, 34], [0, 0.75], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {label}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Un mot tenu a l'ecran, sur fond presque noir. */
export const Statement: React.FC<{text: string; accent?: string}> = ({
  text,
  accent = '#F2EFE9',
}) => {
  const {frame, out, durationInFrames} = useBeat(8);
  const show = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const drift = interpolate(frame, [0, durationInFrames], [1, 1.05]);
  return (
    <AbsoluteFill style={{background: '#070707', opacity: out, transform: `scale(${drift})`}}>
      <StoryText text={text} color={accent} show={show} size={0.13} tracking="0.08em" />
    </AbsoluteFill>
  );
};

/** Une piece, plein cadre, posee sur son fond de marque. */
export const ProductBeat: React.FC<{
  index: number;
  caption?: string;
  shine?: boolean;
}> = ({index, caption, shine = true}) => {
  const {frame, inn, out, durationInFrames} = useBeat(10);
  const {u} = useLayout();
  const p = productAt(index);
  const dark = p.backdrop === '#F2EFE9' ? '#0B0B0B' : '#F2EFE9';
  const turn = interpolate(frame, [0, durationInFrames], [-9, 9]);
  const lit = interpolate(frame, [10, Math.max(30, durationInFrames * 0.7)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  return (
    <AbsoluteFill style={{background: p.backdrop, opacity: out}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(62% 62% at 50% 46%, ${p.color}55 0%, transparent 70%)`,
        }}
      />
      <ProductView
        product={p}
        size={interpolate(inn, [0, 1], [0.5, 0.66])}
        rotateY={turn}
        shine={shine ? lit : -1}
        reflection
        shadow={0.5 * inn}
        opacity={inn}
      />
      {caption ? (
        <AbsoluteFill
          style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '7%'}}
        >
          <div
            style={{
              fontFamily: LABEL,
              fontWeight: 700,
              fontSize: u * 0.026,
              letterSpacing: '0.46em',
              textIndent: '0.46em',
              textTransform: 'uppercase',
              color: dark,
              opacity: interpolate(frame, [12, 30], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {caption}
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/** Plusieurs pieces a la file, coupees court : la collection en mouvement. */
export const Run: React.FC<{index: number; shots: number}> = ({index, shots}) => {
  const {frame, out, durationInFrames} = useBeat(8);
  const per = Math.max(6, Math.floor(durationInFrames / shots));
  const at = Math.min(shots - 1, Math.floor(frame / per));
  const local = frame - at * per;
  const p = productAt(index + at);
  const pop = interpolate(local, [0, 5], [0.86, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{background: p.backdrop, opacity: out}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 70% at 50% 48%, ${p.color}55 0%, transparent 72%)`,
        }}
      />
      <ProductView
        product={p}
        size={0.58 * pop}
        rotateY={(at % 2 === 0 ? 1 : -1) * 10 * (1 - pop) * 8}
        shadow={0.45}
        opacity={interpolate(local, [0, 4], [0, 1], {extrapolateRight: 'clamp'})}
      />
      <AbsoluteFill style={{background: '#fff', opacity: local < 2 ? 0.32 : 0}} />
    </AbsoluteFill>
  );
};

/** Les pieces ensemble, qui glissent : l'identite en mouvement. */
export const Together: React.FC<{index: number}> = ({index}) => {
  const {frame, out, durationInFrames} = useBeat(10);
  const {wide} = useLayout();
  const glide = interpolate(frame, [0, durationInFrames], [0, 1]);
  const count = wide ? 5 : 3;

  return (
    <AbsoluteFill style={{background: '#0B0B0B', opacity: out}}>
      <AbsoluteFill
        style={{background: 'radial-gradient(80% 70% at 50% 50%, #D8480044, transparent 72%)'}}
      />
      {Array.from({length: count}, (_, i) => {
        const p = productAt(index + i);
        const lane = (i - (count - 1) / 2) / count;
        const enter = interpolate(frame, [i * 4, 18 + i * 4], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        return (
          <ProductView
            key={i}
            product={p}
            size={wide ? 0.42 : 0.34}
            x={lane * (wide ? 1.55 : 1.3) + glide * 0.05 * (i % 2 ? -1 : 1)}
            y={(i % 2 ? 0.06 : -0.06) * (1 - glide * 0.4)}
            rotateY={lane * -26}
            shadow={0.4 * enter}
            opacity={enter}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Signature finale : le logo, la phrase de marque, puis le generique. */
export const Signature: React.FC<{creator: string; forWhom: string; claim: string}> = ({
  creator,
  forWhom,
  claim,
}) => {
  const {frame, durationInFrames} = useBeat(0);
  const {u, logoWidth} = useLayout();

  const land = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const say = interpolate(frame, [20, 42], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const sign = interpolate(frame, [52, 74], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const fade = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp'},
  );

  const small: React.CSSProperties = {
    fontFamily: LABEL,
    fontWeight: 500,
    letterSpacing: '0.42em',
    textIndent: '0.42em',
    textTransform: 'uppercase',
    color: '#0B0B0B',
    opacity: 0.6,
  };

  return (
    <AbsoluteFill
      style={{
        background: '#F2EFE9',
        alignItems: 'center',
        justifyContent: 'center',
        gap: u * 0.045,
        opacity: fade,
      }}
    >
      <div style={{transform: `scale(${interpolate(land, [0, 1], [1.16, 1])})`, opacity: land}}>
        <LogoSubset parts={[...WORD, 'trunk', 'tusk_L', 'tusk_R']} color="#0B0B0B" width={logoWidth * 0.78} />
      </div>
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: u * 0.05,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#0B0B0B',
          opacity: say,
          transform: `translateY(${(1 - say) * u * 0.015}px)`,
        }}
      >
        {claim}
      </div>
      <div style={{textAlign: 'center', opacity: sign}}>
        <div style={{...small, fontSize: u * 0.019, marginBottom: u * 0.014}}>
          {forWhom}
        </div>
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: u * 0.038,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#0B0B0B',
          }}
        >
          {creator}
        </div>
      </div>
    </AbsoluteFill>
  );
};
