import React from 'react';
import {
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {ORDER, PIECES} from '../logo/paths';
import {photoAt} from './media';

/**
 * Un plan de substitution, quand la charte n'est pas encore branchee : un
 * detail du logo agrandi, lentement derive. Ce n'est pas un bouche-trou, c'est
 * un plan de marque — le montage tient deja sans une seule photo.
 */
const LogoPlate: React.FC<{index: number; background: string; ink: string}> = ({
  index,
  background,
  ink,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const name = ORDER[index % ORDER.length];
  const [x0, y0, x1, y1] = PIECES[name].bbox;

  // cadrage serre sur la piece, qui s'ouvre doucement
  const zoom = interpolate(frame, [0, durationInFrames], [0.82, 1.05]);
  const w = (x1 - x0) / zoom;
  const h = (y1 - y0) / zoom;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const drift = interpolate(frame, [0, durationInFrames], [-0.04, 0.04]);

  return (
    <div style={{position: 'absolute', inset: 0, background, overflow: 'hidden'}}>
      <svg
        viewBox={`${cx - w / 2 + w * drift} ${cy - h / 2} ${w} ${h}`}
        preserveAspectRatio="xMidYMid slice"
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
      >
        <path d={PIECES[name].d} fill={ink} fillRule="evenodd" />
      </svg>
    </div>
  );
};

export type PlateMotion = 'push' | 'pull' | 'driftLeft' | 'driftRight';

/**
 * Traitement d'un plan, tire de son rang.
 *
 * Le film compte une trentaine de plans. Avec une poignee de photos, la meme
 * image revient plusieurs fois : la recadrer, la zoomer et la desaturer
 * differemment a chaque passage suffit a ce qu'on n'y voie pas une repetition.
 * Tout est derive du rang, donc identique d'un rendu a l'autre.
 */
const treatmentOf = (index: number) => {
  // Deux valeurs de plan en alternance. Les photos sont des produits poses au
  // centre d'un fond uni : tout jouer a la meme distance donne trente plans
  // qui se ressemblent. Le plan serre va chercher la matiere et le logo
  // imprime, le plan large montre la piece entiere ; c'est l'alternance des
  // deux qui fait un montage plutot qu'un catalogue.
  const tight = random(`t${index}`) < 0.4;
  const focusX = tight
    ? 43 + random(`fx${index}`) * 14
    : 34 + random(`fx${index}`) * 32;
  const focusY = tight
    ? 36 + random(`fy${index}`) * 20
    : 30 + random(`fy${index}`) * 36;
  const base = tight
    ? 2.05 + random(`z${index}`) * 0.75
    : 1 + random(`z${index}`) * 0.18;

  // un plan sur trois passe en noir et blanc : le montage respire et la
  // reprise d'une meme image se lit comme un autre plan
  const mono = random(`m${index}`) < 0.34;
  return {
    objectPosition: `${focusX.toFixed(1)}% ${focusY.toFixed(1)}%`,
    base,
    filter: mono
      ? 'grayscale(1) contrast(1.2) brightness(1.02)'
      : 'saturate(1.08) contrast(1.08)',
  };
};

/**
 * Un plan : la photo d'index donne si la charte est branchee, sinon un detail
 * du logo. Toujours en plein cadre, toujours en mouvement — un plan fixe dans
 * un montage court se lit comme un arret sur image.
 */
export const Plate: React.FC<{
  index: number;
  background: string;
  ink: string;
  motion?: PlateMotion;
  /** Amplitude du mouvement. 0 fige le plan. */
  amount?: number;
}> = ({index, background, ink, motion = 'push', amount = 1}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const photo = photoAt(index);

  if (!photo) {
    return <LogoPlate index={index} background={background} ink={ink} />;
  }

  const t = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const {objectPosition, base, filter} = treatmentOf(index);
  const travel = 0.14 * amount;
  const zoomFrom = motion === 'pull' ? base + travel : base;
  const zoomTo = motion === 'pull' ? base : base + travel;
  const scale = interpolate(t, [0, 1], [zoomFrom, zoomTo]);
  const slide =
    motion === 'driftLeft' ? -3.5 : motion === 'driftRight' ? 3.5 : 0;

  return (
    <div style={{position: 'absolute', inset: 0, background, overflow: 'hidden'}}>
      <Img
        src={staticFile(photo)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition,
          filter,
          transform: `scale(${scale}) translateX(${slide * t * amount}%)`,
        }}
      />
    </div>
  );
};
