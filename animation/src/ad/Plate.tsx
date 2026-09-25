import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
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
  const zoomFrom = motion === 'pull' ? 1.16 : 1.02;
  const zoomTo = motion === 'pull' ? 1.02 : 1.16;
  const scale = interpolate(t, [0, 1], [zoomFrom, zoomTo * amount + (1 - amount)]);
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
          transform: `scale(${scale}) translateX(${slide * t * amount}%)`,
        }}
      />
    </div>
  );
};
