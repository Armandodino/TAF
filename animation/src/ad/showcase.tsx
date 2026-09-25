import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {COPY} from './copy';
import {DISPLAY, LABEL} from './fonts';
import {useLayout} from './layout';
import {ProductView} from './Product';
import {productAt, PRODUCTS, type Product} from './products';
import {FlashAt} from './effects/Overlays';

/** Halo place derriere la piece : le fond cesse d'etre un aplat mort. */
const Halo: React.FC<{color: string; spread?: number}> = ({
  color,
  spread = 62,
}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(${spread}% ${spread}% at 50% 46%, ${color} 0%, transparent 70%)`,
      pointerEvents: 'none',
    }}
  />
);

/** Legende d'un plan, en bas de cadre. */
const Caption: React.FC<{text: string; ink: string; show: number}> = ({
  text,
  ink,
  show,
}) => {
  const {u} = useLayout();
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: '7%',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily: LABEL,
          fontWeight: 700,
          fontSize: u * 0.03,
          letterSpacing: '0.44em',
          textIndent: '0.44em',
          textTransform: 'uppercase',
          color: ink,
          opacity: show,
          transform: `translateY(${(1 - show) * u * 0.03}px)`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

/** Encre lisible sur un fond donne. */
const inkOn = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 140 ? '#0B0B0B' : '#F2EFE9';
};

/* ------------------------------------------------------------------ */

/**
 * Ouverture. Le cadre est noir, la piece descend de haut, encore eteinte,
 * et la lumiere la revele en la balayant. Rien d'autre a l'ecran : c'est
 * l'absence de decor qui donne son poids a la premiere piece.
 */
export const Reveal: React.FC<{index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const product = productAt(index);

  const drop = spring({
    frame: frame - 6,
    fps,
    config: {damping: 26, mass: 1.1, stiffness: 78},
  });
  const lit = interpolate(frame, [28, 76], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const wake = interpolate(frame, [30, 72], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const out = interpolate(
    frame,
    [durationInFrames - 18, durationInFrames],
    [1, 1.12],
    {extrapolateLeft: 'clamp'},
  );

  return (
    <AbsoluteFill style={{background: '#070707', transform: `scale(${out})`}}>
      <Halo color={`${product.color}44`} spread={interpolate(wake, [0, 1], [30, 66])} />
      <ProductView
        product={product}
        size={0.66}
        y={interpolate(drop, [0, 1], [-0.55, 0])}
        rotateY={interpolate(drop, [0, 1], [-22, 0])}
        shine={lit}
        shadow={0.7 * wake}
        opacity={interpolate(wake, [0, 1], [0.22, 1])}
      />
    </AbsoluteFill>
  );
};

/**
 * Le plan principal : une piece, plein cadre, qui tourne lentement sur elle
 * meme au-dessus de son reflet. Le fond vient de la piece et contraste avec
 * elle, sinon un vetement noir disparait dans un fond noir.
 */
export const Hero: React.FC<{index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const product = productAt(index);
  const ink = inkOn(product.backdrop);

  const enter = spring({
    frame,
    fps,
    config: {damping: 24, mass: 0.9, stiffness: 90},
  });
  const turn = interpolate(frame, [0, durationInFrames], [-11, 11]);
  const rise = interpolate(frame, [0, durationInFrames], [0.02, -0.02]);
  const shine = interpolate(frame, [42, 96], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });
  const caption = interpolate(frame, [26, 52], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{background: product.backdrop}}>
      <Halo color={`${product.color}55`} />
      <ProductView
        product={product}
        size={interpolate(enter, [0, 1], [0.52, 0.68])}
        y={rise}
        rotateY={turn}
        shine={frame >= 42 && frame <= 96 ? shine : -1}
        reflection
        shadow={0.5 * enter}
        opacity={enter}
      />
      <Caption text={product.label} ink={ink} show={caption} />
    </AbsoluteFill>
  );
};

/** Deux pieces, entrees decalees, chacune de son cote. */
export const Duo: React.FC<{index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const left = productAt(index);
  const right = productAt(index + 1);
  const ink = inkOn(left.backdrop);

  const slide = (delay: number) =>
    spring({
      frame: frame - delay,
      fps,
      config: {damping: 22, mass: 0.8, stiffness: 100},
    });
  const a = slide(0);
  const b = slide(9);
  const drift = interpolate(frame, [0, durationInFrames], [0, 1]);
  const caption = interpolate(frame, [34, 58], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{background: left.backdrop}}>
      <Halo color={`${right.color}55`} spread={74} />
      <ProductView
        product={left}
        size={0.46}
        x={interpolate(a, [0, 1], [-0.7, -0.22]) + drift * 0.02}
        y={0.02}
        rotate={-4}
        rotateY={8}
        reflection
        shadow={0.45 * a}
        opacity={a}
      />
      <ProductView
        product={right}
        size={0.46}
        x={interpolate(b, [0, 1], [0.7, 0.22]) - drift * 0.02}
        y={0.02}
        rotate={4}
        rotateY={-8}
        reflection
        shadow={0.45 * b}
        opacity={b}
      />
      <Caption text={`${left.label} · ${right.label}`} ink={ink} show={caption} />
    </AbsoluteFill>
  );
};

/**
 * Defile : les pieces traversent le cadre a la file. La bande est dessinee
 * deux fois bout a bout, donc le defile boucle sans saut.
 */
export const Carousel: React.FC<{index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const back = productAt(index + 2);
  const ink = inkOn(back.backdrop);
  const span = PRODUCTS.length;
  const travel = interpolate(frame, [0, durationInFrames], [0, -span * 0.52]);
  const caption = interpolate(frame, [20, 44], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{background: back.backdrop, overflow: 'hidden'}}>
      <Halo color={`${back.color}44`} spread={90} />
      {Array.from({length: span * 2}, (_, i) => {
        const p = productAt(index + i);
        const at = travel + i * 0.52 - 0.26;
        // la piece au centre est la plus grande : le defile a un point de mire
        const focus = 1 - Math.min(1, Math.abs(at) / 0.85);
        return (
          <ProductView
            key={i}
            product={p}
            size={0.3 + focus * 0.2}
            x={at}
            y={0.02 - focus * 0.03}
            rotateY={at * -26}
            reflection={focus > 0.5}
            shadow={0.28 + focus * 0.3}
            opacity={Math.min(1, 0.45 + focus)}
          />
        );
      })}
      <Caption text={COPY.collection} ink={ink} show={caption} />
    </AbsoluteFill>
  );
};

/**
 * Le mur : toutes les pieces tiennent le cadre ensemble, puis foncent vers
 * l'objectif. C'est le dernier plan avant le logo, et il doit donner le
 * sentiment d'une collection, pas d'une suite d'articles.
 */
export const Wall: React.FC<{index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const {wide} = useLayout();
  const back = productAt(index);
  const columns = wide ? 3 : 2;
  const cells = PRODUCTS.length;
  const rows = Math.ceil(cells / columns);

  const rush = interpolate(
    frame,
    [durationInFrames - 46, durationInFrames],
    [1, 2.6],
    {extrapolateLeft: 'clamp', easing: Easing.in(Easing.cubic)},
  );
  const fade = interpolate(
    frame,
    [durationInFrames - 26, durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp'},
  );

  return (
    <AbsoluteFill
      style={{background: '#0B0B0B', transform: `scale(${rush})`, opacity: fade}}
    >
      <Halo color={`${back.color}66`} spread={98} />
      {Array.from({length: cells}, (_, i) => {
        const p = productAt(index + i);
        const col = i % columns;
        const row = Math.floor(i / columns);
        // la derniere rangee est rarement pleine : la centrer sur sa propre
        // largeur, sinon la grille penche visiblement vers la gauche
        const inRow = Math.min(columns, cells - row * columns);
        const pop = spring({
          frame: frame - i * 5,
          fps,
          config: {damping: 20, mass: 0.6, stiffness: 130},
        });
        return (
          <ProductView
            key={i}
            product={p}
            size={wide ? 0.3 : 0.24}
            x={(col - (inRow - 1) / 2) * (wide ? 0.3 : 0.32)}
            y={(row - (rows - 1) / 2) * 0.34}
            rotateY={(col - (inRow - 1) / 2) * 12}
            shadow={0.4 * pop}
            opacity={pop}
          />
        );
      })}
      <FlashAt at={durationInFrames - 10} peak={0.5} duration={9} />
    </AbsoluteFill>
  );
};
