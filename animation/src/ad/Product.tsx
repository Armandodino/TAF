import React from 'react';
import {Img, staticFile} from 'remotion';
import type {Product} from './products';

export type ProductViewProps = {
  product: Product;
  /** Hauteur occupee par la piece, en fraction de la hauteur du cadre. */
  size: number;
  /** Decalage par rapport au centre, en fraction du cadre. */
  x?: number;
  y?: number;
  /** Rotations, en degres. rotateY fait pivoter la piece dans la profondeur. */
  rotate?: number;
  rotateY?: number;
  opacity?: number;
  /**
   * Position du balayage de lumiere, de 0 a 1. Hors de cet intervalle, pas de
   * balayage. La lumiere est masquee par la silhouette : elle court sur la
   * piece, pas sur le fond.
   */
  shine?: number;
  /** Reflet au sol. */
  reflection?: boolean;
  /** Force de l'ombre portee, de 0 a 1. */
  shadow?: number;
  blur?: number;
};

/**
 * Une piece detouree, posee dans le cadre.
 *
 * L'ombre est un `drop-shadow` et non une forme dessinee : elle epouse le
 * contour reel du vetement, capuche et manches comprises, ce qu'aucune ellipse
 * posee dessous ne sait faire.
 */
export const ProductView: React.FC<ProductViewProps> = ({
  product,
  size,
  x = 0,
  y = 0,
  rotate = 0,
  rotateY = 0,
  opacity = 1,
  shine = -1,
  reflection = false,
  shadow = 0.55,
  blur = 0,
}) => {
  const src = staticFile(product.file);
  const ratio = product.width / product.height;
  const height = `${size * 100}%`;
  const width = `${size * 100 * ratio}%`;
  const lit = shine >= 0 && shine <= 1;

  const shell: React.CSSProperties = {
    position: 'absolute',
    height,
    width,
    left: `${50 + x * 100}%`,
    top: `${50 + y * 100}%`,
    transform: `translate(-50%, -50%) perspective(1600px) rotateY(${rotateY}deg) rotate(${rotate}deg)`,
    opacity,
    filter: [
      shadow > 0
        ? `drop-shadow(0 ${size * 26}px ${size * 46}px rgba(0,0,0,${shadow}))`
        : '',
      blur > 0 ? `blur(${blur}px)` : '',
    ]
      .filter(Boolean)
      .join(' '),
  };

  const fill: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
  };

  return (
    <>
      {reflection ? (
        <div
          style={{
            ...shell,
            top: `${50 + y * 100 + size * 52}%`,
            transform: `translate(-50%, -50%) scaleY(-1) perspective(1600px) rotateY(${rotateY}deg) rotate(${-rotate}deg)`,
            filter: 'blur(3px)',
            opacity: opacity * 0.22,
            WebkitMaskImage:
              'linear-gradient(to top, rgba(0,0,0,0.9), transparent 62%)',
            maskImage:
              'linear-gradient(to top, rgba(0,0,0,0.9), transparent 62%)',
          }}
        >
          <Img src={src} style={fill} />
        </div>
      ) : null}

      <div style={shell}>
        <Img src={src} style={fill} />
        {lit ? (
          // la lumiere est un degrade masque par la piece elle-meme
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(105deg, transparent ${shine * 140 - 40}%, rgba(255,255,255,0.72) ${shine * 140 - 16}%, transparent ${shine * 140 + 8}%)`,
              WebkitMaskImage: `url(${src})`,
              maskImage: `url(${src})`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              mixBlendMode: 'screen',
              pointerEvents: 'none',
            }}
          />
        ) : null}
      </div>
    </>
  );
};
