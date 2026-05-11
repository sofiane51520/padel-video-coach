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
- Backend : Python FastAPI, puis OpenCV + YOLO pour l'analyse video

## Lancement frontend

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

L'app Expo lit l'URL backend depuis `EXPO_PUBLIC_API_URL`. En local web, `.env.example` utilise :

```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
```

Sur un telephone physique, remplace `localhost` par l'adresse IP locale de ton ordinateur.

## Lancement backend

Le backend FastAPI est dans `backend`.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

Endpoints MVP :

- `GET /health` : verification de l'API.
- `POST /api/analyses` : upload d'une video et creation d'un job d'analyse.
- `GET /api/analyses/{analysis_id}` : statut d'un job.
- `GET /api/analyses/{analysis_id}/result` : resultat d'analyse quand il est pret.

Le moteur d'analyse est volontairement simule pour l'instant. La prochaine etape consiste a remplacer ce service par le pipeline video : extraction d'images, detection terrain/joueurs, tracking, puis suggestions d'echanges a labelliser.

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

backend/app
  api
  core
  models
  services
```
