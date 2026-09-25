import React from 'react';
import {CANVAS, LOGO_BOX, ORDER, PIECES, type PieceName} from './paths';

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

/** Etat d'une piece a une image donnee. */
export type PieceState = {
  /** Progression du volet, de 0 (piece cachee) a 1 (piece entiere). */
  reveal: number;
  /** Bord d'ou le volet s'ouvre. */
  from: 'top' | 'bottom';
  /** Decalage vertical, en unites de toile. */
  dy?: number;
  /** Rotation en degres, autour du pivot naturel de la piece. */
  rotate?: number;
};

export type LogoStates = Record<PieceName, PieceState>;

/**
 * Debord du volet, de tous les cotes.
 *
 * Sans lui, le volet grand ouvert s'arrete pile sur la boite de la piece et
 * tranche ses bords anticrenelis : deux pieces mitoyennes laissent alors
 * paraitre un fil de fond entre elles, par exemple sous le O, la ou commence
 * la trompe. Avec le debord, un volet entierement ouvert ne touche plus a la
 * forme.
 */
const BLEED = 6;

const Shutter: React.FC<{name: PieceName; state: PieceState}> = ({
  name,
  state,
}) => {
  const [x0, y0, x1, y1] = PIECES[name].bbox;
  const top = y0 - BLEED;
  const bottom = y1 + BLEED;
  const open = Math.max(0, Math.min(1, state.reveal)) * (bottom - top);

  return (
    <rect
      x={x0 - BLEED}
      width={x1 - x0 + BLEED * 2}
      y={state.from === 'bottom' ? bottom - open : top}
      height={open}
    />
  );
};

/**
 * Le logo, chaque piece dans son propre volet.
 *
 * Le volet est fixe dans l'espace de la toile et la piece glisse derriere :
 * la forme se decouvre a sa place finale au lieu d'arriver en bloc.
 */
export const LogoLayers: React.FC<{
  states: LogoStates;
  color: string;
  /** Identifiant unique, les clipPath etant globaux au document. */
  uid: string;
}> = ({states, color, uid}) => (
  <svg
    viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.width} ${VIEW_BOX.height}`}
    style={{width: '100%', height: '100%', display: 'block', overflow: 'visible'}}
  >
    <defs>
      {ORDER.map((name) => (
        <clipPath key={name} id={`${uid}-${name}`}>
          <Shutter name={name} state={states[name]} />
        </clipPath>
      ))}
    </defs>

    {ORDER.map((name) => {
      const {dy = 0, rotate = 0} = states[name];
      const [px, py] = PIECES[name].pivot;
      return (
        <g key={name} clipPath={`url(#${uid}-${name})`}>
          <g transform={`translate(0 ${dy}) rotate(${rotate} ${px} ${py})`}>
            <path d={PIECES[name].d} fill={color} fillRule="evenodd" />
          </g>
        </g>
      );
    })}
  </svg>
);

export {LOGO_BOX, CANVAS, ORDER, PIECES};
export type {PieceName};
