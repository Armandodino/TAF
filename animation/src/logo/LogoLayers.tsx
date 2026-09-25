import React from 'react';
import {LOGO_BOX, ORDER, PIECES, type PieceName} from './paths';

/** Marge autour du logo dans le cadrage, en unites de toile. */
const PAD = 14;

/** Cadrage serre sur le logo : la toile d'origine est surtout du vide. */
export const VIEW_BOX = {
  x: LOGO_BOX.x - PAD,
  y: LOGO_BOX.y - PAD,
  width: LOGO_BOX.width + PAD * 2,
  height: LOGO_BOX.height + PAD * 2,
} as const;

export const ASPECT = VIEW_BOX.width / VIEW_BOX.height;

/** Etat d'une piece a une image donnee, en unites de toile. */
export type PieceTransform = {
  x: number;
  y: number;
  rotate: number;
  /** Ecart-type du flou, par axe. Se deduit de la vitesse de la piece. */
  blurX: number;
  blurY: number;
};

export type LogoTransforms = Record<PieceName, PieceTransform>;

/** En dessous, le flou ne se voit pas et coute un filtre pour rien. */
const BLUR_FLOOR = 0.4;

export const LogoLayers: React.FC<{
  transforms: LogoTransforms;
  color: string;
  /** Identifiant unique : les defs SVG sont globales au document. */
  uid: string;
  /** Avancee du balayage de lumiere, de 0 a 1. Hors [0,1], pas de balayage. */
  sheen?: number;
}> = ({transforms, color, uid, sheen = -1}) => {
  const blurred = ORDER.filter(
    (n) => transforms[n].blurX > BLUR_FLOOR || transforms[n].blurY > BLUR_FLOOR,
  );
  const sweeping = sheen >= 0 && sheen <= 1;

  // le balayage part d'avant le bord gauche et sort par la droite
  const sheenWidth = VIEW_BOX.width * 0.3;
  const sheenX =
    VIEW_BOX.x - sheenWidth + sheen * (VIEW_BOX.width + sheenWidth * 2);
  const cx = VIEW_BOX.x + VIEW_BOX.width / 2;
  const cy = VIEW_BOX.y + VIEW_BOX.height / 2;

  return (
    <svg
      viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.width} ${VIEW_BOX.height}`}
      style={{width: '100%', height: '100%', display: 'block', overflow: 'visible'}}
    >
      <defs>
        {blurred.map((name) => (
          <filter
            key={name}
            id={`${uid}-blur-${name}`}
            // le flou deborde largement : sans marge, le filtre rabote la trainee
            x="-70%"
            y="-70%"
            width="240%"
            height="240%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur
              stdDeviation={`${transforms[name].blurX} ${transforms[name].blurY}`}
            />
          </filter>
        ))}

        {sweeping ? (
          <>
            <clipPath id={`${uid}-silhouette`}>
              {ORDER.map((name) => (
                <path key={name} d={PIECES[name].d} clipRule="evenodd" />
              ))}
            </clipPath>
            <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fff" stopOpacity="0" />
              <stop offset="50%" stopColor="#fff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </>
        ) : null}
      </defs>

      {ORDER.map((name) => {
        const t = transforms[name];
        const [px, py] = PIECES[name].pivot;
        const filter =
          t.blurX > BLUR_FLOOR || t.blurY > BLUR_FLOOR
            ? `url(#${uid}-blur-${name})`
            : undefined;
        return (
          <g
            key={name}
            filter={filter}
            transform={`translate(${t.x} ${t.y}) rotate(${t.rotate} ${px} ${py})`}
          >
            <path d={PIECES[name].d} fill={color} fillRule="evenodd" />
          </g>
        );
      })}

      {sweeping ? (
        <g clipPath={`url(#${uid}-silhouette)`}>
          <rect
            x={sheenX}
            y={VIEW_BOX.y - VIEW_BOX.height}
            width={sheenWidth}
            height={VIEW_BOX.height * 3}
            fill={`url(#${uid}-sheen)`}
            transform={`rotate(-16 ${cx} ${cy})`}
          />
        </g>
      ) : null}
    </svg>
  );
};
