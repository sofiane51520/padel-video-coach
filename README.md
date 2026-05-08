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

## Stack

- Expo SDK 55
- React Native + Expo Router
- TypeScript
- Web via React Native Web
- Backend prevu : Python FastAPI + OpenCV + YOLO

## Lancement

Installe les dependances puis lance Expo :

```bash
npm install
npm run web
```

Tu peux aussi lancer l'app mobile avec :

```bash
npm run android
npm run ios
```

Note locale : sur cette machine, `node` est disponible mais `npm` pointe actuellement vers une installation utilisateur incomplete. Si `npm install` echoue, reinstalle Node.js LTS ou repare npm avant de lancer Expo.

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
src/types
```
