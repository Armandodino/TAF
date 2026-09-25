# Animer le logo AYOKA dans Canva

## Pourquoi des PNG et pas le SVG

Canva aplatit un SVG à l'import : le logo redevient un seul bloc, impossible à animer
par morceaux. Ce sont donc les PNG de ce dossier qui servent de calques — un fichier
par pièce, fond transparent.

Tous les fichiers font **1265 × 1265 px** et la pièce y est à sa place définitive.
Posés à la même taille et centrés sur la page, ils se remettent d'aplomb tout seuls :
il n'y a jamais à les repositionner à la main.

## Quel jeu choisir

| Dossier | Contenu | Pour |
|---|---|---|
| `lettres-noir` | 8 calques : A, Y, O, K, A, trompe, 2 défenses | animer le mot lettre par lettre |
| `anatomie-noir` | 6 calques : 2 oreilles, crâne, trompe, 2 défenses | animer l'éléphant |
| `…-blanc` | les mêmes, en blanc | fond sombre |
| `trompe-a-plis` | trompe pleine + ses 4 plis | faire apparaître les plis un à un |

Le fichier `0-logo-complet.png` de chaque dossier est le logo entier : il sert à caler
la taille au départ, et de dernière image si l'animation doit finir sur le logo net.

## Mise en place

1. Crée un design **Vidéo** — 1080 × 1080 pour un post, 1080 × 1920 pour un reel.
   Le format vidéo est ce qui donne accès à la chronologie, donc au décalage entre
   calques : c'est là que tout se joue.
2. Onglet **Importer**, dépose tout le dossier d'un coup. Les fichiers sont numérotés
   dans l'ordre d'animation, la bibliothèque les affiche déjà dans le bon ordre.
3. Pose `0-logo-complet.png`, donne-lui la taille voulue, centre-le
   (**Position → Aligner → Centrer**, horizontalement et verticalement). Note sa
   largeur.
4. Pose les autres calques, donne à chacun **la même largeur** et **le même centrage**.
   Ils sont alignés. Supprime `0-logo-complet` si l'animation ne finit pas dessus.

Astuce : place et cale un seul calque, puis copie-colle-le et remplace simplement son
image (clic droit → remplacer) — la taille et la position sont conservées.

L'ordre d'empilement n'a pas d'importance : les pièces ne se chevauchent pas. Seule
exception, les plis de la trompe, qui doivent rester **au-dessus** de la trompe pleine.

## Échelonner

Dans un design vidéo, chaque calque a sa barre sur la chronologie en bas. Fais glisser
le début de chaque barre pour décider quand le calque entre. C'est le décalage entre
ces barres qui crée la séquence — l'animation appliquée à un calque, elle, se joue
toujours à son entrée.

Sans chronologie (design non vidéo), l'équivalent est de faire une page par étape, avec
une durée courte par page.

## Trois séquences qui marchent bien

**Le mot se compose** — dossier `lettres`.
Décale les entrées de 0,15 s : A, Y, O, K, A. Animation **Élévation** ou **Fondu** sur
chaque lettre. Puis trompe et défenses 0,3 s après la dernière lettre.

**L'éléphant se réveille** — dossier `anatomie`.
Crâne d'abord (Fondu). Oreilles 0,25 s après, en **Glissement** depuis l'extérieur,
gauche et droite. Défenses ensuite, en **Élévation** (elles ont l'air de pousser vers
le bas). Trompe en dernier, également en Élévation.

**La trompe se dessine** — dossier `trompe-a-plis`.
Trompe pleine en Élévation, puis les quatre plis en Fondu, décalés de 0,12 s du haut
vers le bas.

Pour un mouvement que Canva ne propose pas tel quel — une oreille qui bat, la trompe
qui balance — utilise **Créer une animation** et trace le trajet à la main. À savoir :
Canva fait toujours pivoter un élément autour de son centre, il n'y a pas de point de
pivot réglable ; une rotation franche depuis l'attache d'une oreille n'est donc pas
possible directement.

## Le piège des plis

Dans `trompe-a-plis`, les plis sont des **contre-formes** : des traits de la couleur du
fond, pas du logo. D'où les deux sous-dossiers, `sur-fond-clair` (plis blancs) et
`sur-fond-sombre` (plis noirs). Prends celui qui correspond à ton fond, sinon les plis
se verront comme des traits de la mauvaise couleur.

Le fichier `trompe.png` des dossiers `lettres` et `anatomie`, lui, a ses plis en
transparence : il fonctionne sur n'importe quel fond, mais ses plis ne s'animent pas
séparément.
