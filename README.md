# Padel Video Coach

Squelette Expo pour une application cross-platform web, iOS et Android qui analyse une video de padel.

## MVP

- Import d'une video depuis le telephone ou le web.
- Calibration du terrain.
- Identification des 4 joueurs.
- Analyse automatique preparee cote backend.
- Revue des echanges avec deux labels uniquement :
  - `Faute` : le joueur termine l'echange par une erreur directe.
  - `Point gagnant` : le joueur termine l'echange par un coup que l'adversaire ne remet pas.
- Rapport par joueur : distance parcourue, fautes, points gagnants.

## Flux actuel

- L'import video cree un vrai match dans le store applicatif.
- Le match nouvellement cree devient le match actif.
- La calibration permet de placer les quatre coins du terrain.
- Les noms des joueurs sont modifiables.
- La revue enregistre les fautes et points gagnants sur le match actif.
- Le rapport recalcule les fautes et points gagnants depuis les tags.
- Les matchs sont sauvegardes localement avec AsyncStorage.

## Stack

- Expo SDK 55
- React Native + Expo Router
- TypeScript
- Tamagui
- AsyncStorage
- Web via React Native Web
- Backend prevu : Python FastAPI + OpenCV + YOLO

## Lancement

Installe les dependances puis lance Expo :

```bash
corepack pnpm install
corepack pnpm web
```

Tu peux aussi lancer l'app mobile avec :

```bash
corepack pnpm android
corepack pnpm ios
```

Note locale : sur cette machine, `node` est disponible mais `npm` pointe actuellement vers une installation utilisateur incomplete. Utilise `corepack pnpm`.

## Structure

```text
src/app
  _layout.tsx
  (tabs)
    index.tsx
    upload.tsx
    review.tsx
    report.tsx
  analysis/[id].tsx
  calibration/[id].tsx
  matches/[id].tsx
  players/[id].tsx

src/components
src/constants
src/data
src/store
src/types
src/utils
```
