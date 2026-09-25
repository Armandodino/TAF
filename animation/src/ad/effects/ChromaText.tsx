import React from 'react';

/**
 * Texte avec aberration chromatique : deux doubles colores se decalent de part
 * et d'autre, comme un objectif qui ne fait pas converger les couleurs. C'est
 * l'effet qui fait lire le texte comme une image et non comme une legende.
 */
export const ChromaText: React.FC<{
  children: React.ReactNode;
  /** Ecart des doubles, en pixels. 0 : texte net. */
  split: number;
  color: string;
  style?: React.CSSProperties;
}> = ({children, split, color, style}) => {
  const ghost: React.CSSProperties = {
    ...style,
    position: 'absolute',
    inset: 0,
    mixBlendMode: 'screen',
    pointerEvents: 'none',
  };
  return (
    <div style={{position: 'relative', ...style, color}}>
      {split > 0.2 ? (
        <>
          <div
            style={{
              ...ghost,
              color: '#ff2d2d',
              transform: `translateX(${-split}px)`,
            }}
          >
            {children}
          </div>
          <div
            style={{
              ...ghost,
              color: '#2dfaff',
              transform: `translateX(${split}px)`,
            }}
          >
            {children}
          </div>
        </>
      ) : null}
      <div style={{position: 'relative'}}>{children}</div>
    </div>
  );
};
