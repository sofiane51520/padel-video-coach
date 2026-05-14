from pathlib import Path

import cv2
import numpy as np
from fastapi.testclient import TestClient

from app.main import app
from app.models.analysis import StoredVideo
from app.services.rally_detection import DetectionStats, RallyDetectionService
from app.services.video_probe import video_probe_service


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


def test_detects_rallies_from_video_activity(tmp_path: Path) -> None:
    video_path = create_activity_video(tmp_path)
    stored_video = StoredVideo(
        id="activity-video",
        original_filename="activity.avi",
        content_type="video/x-msvideo",
        path=video_path,
        size_bytes=video_path.stat().st_size,
    )
    video_probe = video_probe_service.probe(stored_video)

    detector = RallyDetectionService(model_enabled=False)
    rallies = detector.detect(stored_video, video_probe)

    assert len(rallies) == 2
    assert rallies[0].start_time == "00:00"
    assert rallies[0].end_time == "00:04"
    assert rallies[1].start_time == "00:04"
    assert rallies[1].end_time == "00:08"


def test_ball_position_movement_drives_ai_activity_score() -> None:
    detector = RallyDetectionService(model_enabled=False)
    stats = DetectionStats(
        player_count=0,
        ball_count=1,
        max_player_confidence=0,
        max_ball_confidence=0.9,
        ball_center=(120, 80),
    )

    stationary_score = detector._ai_activity_score(0.08, stats, ball_movement=0.002)
    unknown_score = detector._ai_activity_score(0.08, stats, ball_movement=None)
    moving_score = detector._ai_activity_score(0.08, stats, ball_movement=0.05)

    assert stationary_score < unknown_score
    assert moving_score > unknown_score


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


def create_activity_video(tmp_path: Path) -> Path:
    path = tmp_path / "activity.avi"
    fps = 4
    writer = cv2.VideoWriter(
        str(path),
        cv2.VideoWriter_fourcc(*"MJPG"),
        fps,
        (320, 180),
    )

    for index in range(32):
        frame = np.zeros((180, 320, 3), dtype=np.uint8)

        if 4 <= index <= 12 or 20 <= index <= 28:
            x = 40 + (index % 8) * 25
            cv2.circle(frame, (x, 90), 18, (255, 255, 255), -1)

        writer.write(frame)

    writer.release()
    return path
