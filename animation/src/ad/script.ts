// Genere par tools/build_voiceover.py — ne pas editer a la main.
// Le minutage vient de la voix reellement synthetisee : chaque plan
// dure exactement le temps de sa replique.

export const VOICE_FILE = 'audio/voix.wav';
export const VOICE_FRAMES = 1972;

export type Line = {
  key: string;
  text: string;
  /** Image de depart de la replique. */
  frame: number;
  /** Duree de la replique, silence de fin compris. */
  frames: number;
};

export const SCRIPT: readonly Line[] = [
  {"key": "ouverture", "text": "Certaines marques naissent d'une idée.", "frame": 33, "frames": 73},
  {"key": "origine", "text": "AYOKA, elle, naît d'une histoire.", "frame": 106, "frames": 105},
  {"key": "ivoirienne", "text": "Une histoire profondément ivoirienne.", "frame": 210, "frames": 85},
  {"key": "bete", "text": "AYOKA, un nom inspiré du peuple bété,", "frame": 295, "frames": 89},
  {"key": "racines", "text": "porte en lui nos racines, notre culture, notre identité.", "frame": 384, "frames": 131},
  {"key": "elephant", "text": "Puis vient l'éléphant.", "frame": 514, "frames": 48},
  {"key": "symbole", "text": "Symbole emblématique de la Côte d'Ivoire, il représente la force, la prestance, et cette empreinte que l'on laisse derrière soi.", "frame": 563, "frames": 254},
  {"key": "reunir", "text": "Alors, nous avons réuni les deux.", "frame": 816, "frames": 90},
  {"key": "mot", "text": "Un mot.", "frame": 907, "frames": 33},
  {"key": "signe", "text": "Un symbole.", "frame": 939, "frames": 43},
  {"key": "identite", "text": "Une identité.", "frame": 983, "frames": 54},
  {"key": "naissance", "text": "Et de cette rencontre est né AYOKA.", "frame": 1036, "frames": 86},
  {"key": "marque", "text": "Une marque de vêtements qui transforme notre héritage en une nouvelle façon de s'exprimer.", "frame": 1122, "frames": 161},
  {"key": "pieces", "text": "Des pièces que l'on porte.", "frame": 1283, "frames": 50},
  {"key": "affirme", "text": "Une identité que l'on affirme.", "frame": 1333, "frames": 71},
  {"key": "passe", "text": "Parce que notre culture n'appartient pas seulement au passé.", "frame": 1405, "frames": 103},
  {"key": "evolue", "text": "Elle évolue. Elle se réinvente. Elle se porte.", "frame": 1507, "frames": 105},
  {"key": "rencontre", "text": "AYOKA, c'est la rencontre entre nos racines et notre époque.", "frame": 1612, "frames": 125},
  {"key": "surnous", "text": "Notre histoire sur nous.", "frame": 1738, "frames": 52},
  {"key": "mouvement", "text": "Notre identité, en mouvement.", "frame": 1790, "frames": 75},
  {"key": "signature", "text": "AYOKA. Porte ton histoire.", "frame": 1865, "frames": 106},
];

/** Replique par identifiant. */
export const line = (key: string): Line => {
  const found = SCRIPT.find((l) => l.key === key);
  if (!found) throw new Error(`replique inconnue : ${key}`);
  return found;
};
