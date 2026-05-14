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
GET  /api/analyses/{analysis_id}
GET  /api/analyses/{analysis_id}/result
```

`POST /api/analyses` attend un formulaire multipart :

- `video` : fichier video.
- `match_id` : identifiant du match cote app.
- `players` : tableau JSON des joueurs identifies dans l'app.

Le traitement est simule pour le moment. La prochaine etape sera d'affiner le pipeline OpenCV/YOLO avec un modele specialise padel/tennis.
Le backend lit deja la video avec OpenCV pour extraire les metadonnees et une frame par seconde dans `.data/frames`.
Les echanges proposes sont detectes avec YOLO (`person` et `sports ball`) combine a l'activite observee dans la video. Si le modele n'est pas disponible, le backend retombe sur le detecteur OpenCV.

## Acceleration GPU NVIDIA

Par defaut, `YOLO_DEVICE=auto` utilise `cuda:0` si PyTorch detecte CUDA, sinon `cpu`.

Sur une machine NVIDIA, installer la build CUDA de PyTorch dans le venv backend :

```powershell
.\.venv\Scripts\python.exe -m pip install --upgrade torch torchvision --index-url https://download.pytorch.org/whl/cu128
```

Verification :

```powershell
.\.venv\Scripts\python.exe -c "import torch; print(torch.__version__, torch.cuda.is_available(), torch.cuda.get_device_name(0))"
```
