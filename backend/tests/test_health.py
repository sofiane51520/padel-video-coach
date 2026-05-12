from pathlib import Path

import cv2
import numpy as np
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_analysis_with_match_metadata(tmp_path: Path) -> None:
    video_path = create_sample_video(tmp_path)

    response = client.post(
        "/api/analyses",
        data={
            "match_id": "match-1",
            "calibration_points": (
                '[{"id":"c1","label":"Coin 1","x":0.1,"y":0.2},'
                '{"id":"c2","label":"Coin 2","x":0.9,"y":0.2}]'
            ),
            "players": (
                '[{"id":"match-1-p1","label":"Joueur 1","team":"A"},'
                '{"id":"match-1-p2","label":"Joueur 2","team":"A"}]'
            ),
        },
        files={"video": ("match.avi", video_path.read_bytes(), "video/x-msvideo")},
    )

    assert response.status_code == 202
    payload = response.json()
    assert payload["match_id"] == "match-1"
    assert payload["metadata"]["players"][0]["id"] == "match-1-p1"

    result_response = client.get(f"/api/analyses/{payload['id']}/result")

    assert result_response.status_code == 200
    result = result_response.json()
    assert result["video_probe"]["width"] == 320
    assert result["video_probe"]["height"] == 180
    assert result["video_probe"]["fps"] == 2
    assert len(result["video_probe"]["extracted_frames"]) >= 2
    assert result["player_tracking"][0]["player_id"] == "match-1-p1"


def test_suggest_calibration_from_video(tmp_path: Path) -> None:
    video_path = create_sample_video(tmp_path)

    response = client.post(
        "/api/calibration/suggestions",
        files={"video": ("match.avi", video_path.read_bytes(), "video/x-msvideo")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["points"]) == 4
    assert payload["points"][0]["label"] == "Coin arriere gauche"
    assert 0 <= payload["confidence"] <= 1


def create_sample_video(tmp_path: Path) -> Path:
    path = tmp_path / "sample.avi"
    writer = cv2.VideoWriter(
        str(path),
        cv2.VideoWriter_fourcc(*"MJPG"),
        2,
        (320, 180),
    )

    for index in range(4):
        frame = np.full((180, 320, 3), index * 40, dtype=np.uint8)
        writer.write(frame)

    writer.release()
    return path
