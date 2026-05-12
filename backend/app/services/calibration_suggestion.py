from pathlib import Path

import cv2
import numpy as np

from app.models.analysis import CalibrationPointInput, CalibrationSuggestion, StoredVideo

COURT_LABELS = [
    ("back-left", "Fond gauche"),
    ("back-right", "Fond droit"),
    ("net-right", "Filet droit"),
    ("net-left", "Filet gauche"),
]


class CalibrationSuggestionService:
    def suggest(self, stored_video: StoredVideo) -> CalibrationSuggestion:
        frame, frame_time_seconds = self._read_reference_frame(stored_video.path)
        height, width = frame.shape[:2]
        contour = self._detect_court_quad(frame)

        if contour is not None:
            points = self._points_from_contour(contour, width=width, height=height)
            return CalibrationSuggestion(
                points=points,
                confidence=0.62,
                method="opencv_contour",
                frame_time_seconds=frame_time_seconds,
            )

        return CalibrationSuggestion(
            points=self._fallback_points(),
            confidence=0.25,
            method="fallback_template",
            frame_time_seconds=frame_time_seconds,
        )

    def _read_reference_frame(self, path: Path) -> tuple[np.ndarray, float]:
        capture = cv2.VideoCapture(str(path))

        if not capture.isOpened():
            raise ValueError("Impossible d'ouvrir la video")

        try:
            fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)
            frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
            frame_index = max(0, frame_count // 3)
            capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
            success, frame = capture.read()

            if not success or frame is None:
                raise ValueError("Impossible de lire une frame de reference")

            frame_time_seconds = frame_index / fps if fps > 0 else 0
            return frame, round(frame_time_seconds, 2)
        finally:
            capture.release()

    def _detect_court_quad(self, frame: np.ndarray) -> np.ndarray | None:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        frame_area = frame.shape[0] * frame.shape[1]
        candidates: list[tuple[float, np.ndarray]] = []

        for contour in contours:
            perimeter = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.04 * perimeter, True)
            area = cv2.contourArea(approx)

            if len(approx) == 4 and area > frame_area * 0.08:
                candidates.append((area, approx.reshape(4, 2)))

        if not candidates:
            return None

        return max(candidates, key=lambda candidate: candidate[0])[1]

    def _points_from_contour(
        self,
        contour: np.ndarray,
        width: int,
        height: int,
    ) -> list[CalibrationPointInput]:
        ordered_points = self._order_points(contour)

        return [
            CalibrationPointInput(
                id=COURT_LABELS[index][0],
                label=COURT_LABELS[index][1],
                x=float(np.clip(point[0] / width, 0, 1)),
                y=float(np.clip(point[1] / height, 0, 1)),
            )
            for index, point in enumerate(ordered_points)
        ]

    def _order_points(self, points: np.ndarray) -> np.ndarray:
        ordered_points = np.zeros((4, 2), dtype=np.float32)
        point_sum = points.sum(axis=1)
        point_diff = np.diff(points, axis=1).reshape(4)

        ordered_points[0] = points[np.argmin(point_sum)]
        ordered_points[2] = points[np.argmax(point_sum)]
        ordered_points[1] = points[np.argmin(point_diff)]
        ordered_points[3] = points[np.argmax(point_diff)]

        return ordered_points

    def _fallback_points(self) -> list[CalibrationPointInput]:
        normalized_points = [(0.18, 0.22), (0.82, 0.22), (0.92, 0.82), (0.08, 0.82)]

        return [
            CalibrationPointInput(
                id=COURT_LABELS[index][0],
                label=COURT_LABELS[index][1],
                x=x,
                y=y,
            )
            for index, (x, y) in enumerate(normalized_points)
        ]


calibration_suggestion_service = CalibrationSuggestionService()
