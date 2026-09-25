import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {AyokaImpact} from '../AyokaImpact';
import {COPY} from './copy';
import './fonts';
import {Grain, Vignette} from './effects/Overlays';
import {ORDER} from '../logo/paths';
import {line, SCRIPT, VOICE_FRAMES} from './script';

/** Voix, nappe et effets, deja mixes : une seule piste a poser. */
const SOUNDTRACK = 'audio/bande-son.wav';
import {
  BEAST,
  DarkMatter,
  HalfLogo,
  ProductBeat,
  Run,
  Signature,
  Statement,
  Together,
  WORD,
} from './story';

export const FILM_FRAMES = VOICE_FRAMES;

/**
 * Le film, une scene par replique.
 *
 * Les bornes ne sont pas choisies : elles viennent du minutage de la voix
 * reellement synthetisee. Un plan commence quand sa phrase commence et finit
 * quand elle finit, donc l'image ne peut pas deriver du texte.
 */
const STAGE: Record<string, React.ReactNode> = {
  // le noir, la matiere : la voix pose l'histoire avant qu'on montre quoi que ce soit
  ouverture: <DarkMatter index={2} />,
  origine: <DarkMatter index={3} tint="#1F5F2A" />,
  ivoirienne: <DarkMatter index={4} tint="#D84800" />,

  // le mot
  bete: <HalfLogo parts={WORD} label="le mot" />,
  racines: <HalfLogo parts={WORD} />,

  // l'animal
  elephant: <HalfLogo parts={BEAST} label="le symbole" />,
  symbole: <HalfLogo parts={BEAST} />,

  // les deux ensemble, encore separes a l'oeil
  reunir: <HalfLogo parts={ORDER} />,

  mot: <Statement text="Un mot" />,
  signe: <Statement text="Un symbole" />,
  identite: <Statement text="Une identité" accent="#D84800" />,

  // le choc : le logo s'assemble sur « est né AYOKA »
  naissance: <AyokaImpact background="#F2EFE9" ink="#0B0B0B" tagline="" />,

  // les pieces
  marque: <ProductBeat index={2} caption="Hoodie" />,
  pieces: <ProductBeat index={3} caption="Sweatshirt" />,
  affirme: <ProductBeat index={4} caption="T-shirt" />,
  passe: <ProductBeat index={0} caption="Bob" shine={false} />,
  evolue: <Run index={0} shots={5} />,
  rencontre: <Together index={0} />,
  surnous: <ProductBeat index={1} caption="Casquette" />,
  mouvement: <Together index={2} />,

  signature: (
    <Signature
      creator={COPY.creator}
      forWhom={COPY.forWhom}
      claim="Porte ton histoire"
    />
  ),
};

export const AyokaStory: React.FC = () => (
  <AbsoluteFill style={{background: '#050505'}}>
    <Audio src={staticFile(SOUNDTRACK)} />

    {SCRIPT.map((l) => (
      <Sequence key={l.key} from={l.frame} durationInFrames={l.frames} name={l.key}>
        {STAGE[l.key] ?? null}
      </Sequence>
    ))}

    {/* avant la premiere replique, l'ecran ne doit pas etre vide */}
    <Sequence from={0} durationInFrames={line('ouverture').frame + 2}>
      <DarkMatter index={2} />
    </Sequence>

    <Grain opacity={0.06} />
    <Vignette strength={0.32} />
  </AbsoluteFill>
);
