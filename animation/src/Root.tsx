import React from 'react';
import {Composition} from 'remotion';
import {AyokaReveal, type AyokaRevealProps} from './AyokaReveal';
import {FPS, THEME, TOTAL_FRAMES} from './theme';

/**
 * Trois formats du meme film. Pour changer la ligne sous le logo ou inverser
 * les couleurs, il suffit de toucher aux defaultProps ci-dessous.
 */
export const RemotionRoot: React.FC = () => {
  const common = {
    component: AyokaReveal,
    durationInFrames: TOTAL_FRAMES,
    fps: FPS,
  } as const;

  const light: AyokaRevealProps = {
    background: THEME.ivory,
    ink: THEME.ink,
    tagline: '',
  };
  const dark: AyokaRevealProps = {
    background: THEME.ink,
    ink: THEME.ivory,
    tagline: '',
  };

  return (
    <>
      {/* post carre */}
      <Composition
        {...common}
        id="AyokaReveal"
        width={1080}
        height={1080}
        defaultProps={light}
      />
      {/* reel et story */}
      <Composition
        {...common}
        id="AyokaReel"
        width={1080}
        height={1920}
        defaultProps={dark}
      />
      {/* banniere de site, en-tete de video */}
      <Composition
        {...common}
        id="AyokaBanner"
        width={1920}
        height={1080}
        defaultProps={light}
      />
    </>
  );
};
