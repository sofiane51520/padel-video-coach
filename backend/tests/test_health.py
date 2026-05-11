from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_analysis_with_match_metadata() -> None:
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
        files={"video": ("match.mp4", b"fake video", "video/mp4")},
    )

    assert response.status_code == 202
    payload = response.json()
    assert payload["match_id"] == "match-1"
    assert payload["metadata"]["players"][0]["id"] == "match-1-p1"

    result_response = client.get(f"/api/analyses/{payload['id']}/result")

    assert result_response.status_code == 200
    result = result_response.json()
    assert result["player_tracking"][0]["player_id"] == "match-1-p1"
