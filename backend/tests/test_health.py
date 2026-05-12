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
    assert len(result["rallies"]) == 1
    assert result["rallies"][0]["start_time"] == "00:00"
    assert result["rallies"][0]["end_time"] == "00:02"


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
