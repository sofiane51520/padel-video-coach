# Backend Padel Video Coach

API FastAPI pour recevoir les videos, creer un job d'analyse et exposer un resultat compatible avec l'application Expo.

## Lancement

Depuis `backend/` :

```bash
python -m venv .venv
.venv\Scripts\activate
python -m pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

Sur macOS/Linux :

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

## Endpoints

```text
GET  /health
POST /api/analyses
POST /api/calibration/suggestions
GET  /api/analyses/{analysis_id}
GET  /api/analyses/{analysis_id}/result
```

`POST /api/analyses` attend un formulaire multipart :

- `video` : fichier video.
- `match_id` : identifiant du match cote app.
- `calibration_points` : tableau JSON des points terrain normalises.
- `players` : tableau JSON des joueurs identifies dans l'app.

`POST /api/calibration/suggestions` reçoit une video et propose quatre reperes de terrain normalises. La suggestion est une aide : elle reste corrigeable dans l'app.

Le traitement est simule pour le moment. La prochaine etape sera de remplacer `app/services/analysis_service.py` par un pipeline OpenCV/YOLO.
Le backend lit deja la video avec OpenCV pour extraire les metadonnees et une frame par seconde dans `.data/frames`.
