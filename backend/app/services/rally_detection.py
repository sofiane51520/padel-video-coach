from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from app.core.config import settings
from app.models.analysis import RallySuggestion, StoredVideo, VideoProbe


@dataclass(frozen=True)
class ActivitySample:
    timestamp_seconds: float
    score: float


@dataclass(frozen=True)
class DetectionStats:
    player_count: int
    ball_count: int
    max_player_confidence: float
    max_ball_confidence: float
    ball_center: tuple[float, float] | None = None


@dataclass(frozen=True)
class ActivitySegment:
    start_seconds: float
    end_seconds: float


class RallyDetectionService:
    sample_rate_fps = 4
    min_rally_seconds = 2.0
    max_inactive_gap_seconds = 1.5
    edge_padding_seconds = 0.8
    min_active_ball_movement = 0.01
    yolo_classes = (0, 32)

    def __init__(
        self,
        model_enabled: bool = settings.yolo_enabled,
        model_path: Path = settings.yolo_model_path,
        model_name: str = settings.yolo_model_name,
        model_confidence: float = settings.yolo_confidence,
        model_device: str = settings.yolo_device,
        half_precision: bool = settings.yolo_half_precision,
    ) -> None:
        self.model_enabled = model_enabled
        self.model_path = model_path
        self.model_name = model_name
        self.model_confidence = model_confidence
        self.model_device = model_device
        self.half_precision = half_precision
        self._model: Any | None = None
        self._model_load_failed = False
        self._resolved_device: str | None = None

    def detect(self, stored_video: StoredVideo, video_probe: VideoProbe) -> list[RallySuggestion]:
        samples = self._sample_model_activity(stored_video.path, video_probe)

        if not samples:
            samples = self._sample_motion_activity(stored_video.path, video_probe)

        if not samples:
            return self._single_rally(video_probe)

        segments = self._build_activity_segments(samples, video_probe.duration_seconds)

        if not segments:
            return self._single_rally(video_probe)

        return [
            RallySuggestion(
                id=f"r{index + 1}",
                index=index + 1,
                start_time=self._format_clock(segment.start_seconds),
                end_time=self._format_clock(segment.end_seconds),
            )
            for index, segment in enumerate(segments)
        ]

    def _sample_model_activity(
        self,
        video_path: Path,
        video_probe: VideoProbe,
    ) -> list[ActivitySample]:
        model = self._load_model()

        if model is None:
            return []

        capture = cv2.VideoCapture(str(video_path))

        if not capture.isOpened() or video_probe.fps <= 0:
            return []

        frame_step = max(1, round(video_probe.fps / self.sample_rate_fps))
        previous_frame: np.ndarray | None = None
        previous_ball_center: tuple[float, float] | None = None
        samples: list[ActivitySample] = []
        detected_objects = 0

        try:
            frame_index = 0

            while frame_index < video_probe.frame_count:
                capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
                success, frame = capture.read()

                if not success:
                    break

                prepared_frame = self._prepare_frame(frame)
                timestamp_seconds = frame_index / video_probe.fps
                motion_score = (
                    0 if previous_frame is None else self._motion_score(previous_frame, prepared_frame)
                )
                stats = self._detect_objects(model, frame)
                ball_movement = self._ball_movement(
                    previous_ball_center,
                    stats.ball_center,
                    frame,
                )
                detected_objects += stats.player_count + stats.ball_count
                samples.append(
                    ActivitySample(
                        timestamp_seconds=timestamp_seconds,
                        score=self._ai_activity_score(motion_score, stats, ball_movement),
                    )
                )
                previous_frame = prepared_frame
                previous_ball_center = stats.ball_center or previous_ball_center
                frame_index += frame_step
        finally:
            capture.release()

        return samples if detected_objects > 0 else []

    def _sample_motion_activity(
        self,
        video_path: Path,
        video_probe: VideoProbe,
    ) -> list[ActivitySample]:
        capture = cv2.VideoCapture(str(video_path))

        if not capture.isOpened() or video_probe.fps <= 0:
            return []

        frame_step = max(1, round(video_probe.fps / self.sample_rate_fps))
        previous_frame: np.ndarray | None = None
        samples: list[ActivitySample] = []

        try:
            frame_index = 0

            while frame_index < video_probe.frame_count:
                capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
                success, frame = capture.read()

                if not success:
                    break

                prepared_frame = self._prepare_frame(frame)
                timestamp_seconds = frame_index / video_probe.fps

                if previous_frame is None:
                    score = 0
                else:
                    score = self._motion_score(previous_frame, prepared_frame)

                samples.append(ActivitySample(timestamp_seconds=timestamp_seconds, score=score))
                previous_frame = prepared_frame
                frame_index += frame_step
        finally:
            capture.release()

        return samples

    def _load_model(self) -> Any | None:
        if not self.model_enabled or self._model_load_failed:
            return None

        if self._model is not None:
            return self._model

        try:
            from ultralytics import YOLO

            if self.model_path.exists():
                self._model = YOLO(str(self.model_path))
            else:
                self._model = YOLO(self.model_name)

            self._resolved_device = self._resolve_device()
            self._model.to(self._resolved_device)
        except Exception:
            self._model_load_failed = True
            return None

        return self._model

    def _resolve_device(self) -> str:
        requested_device = self.model_device.strip().lower()

        if requested_device and requested_device != "auto":
            return requested_device

        try:
            import torch

            if torch.cuda.is_available():
                return "cuda:0"
        except Exception:
            return "cpu"

        return "cpu"

    def _detect_objects(self, model: Any, frame: np.ndarray) -> DetectionStats:
        device = self._resolved_device or self._resolve_device()
        use_half_precision = self.half_precision and device.startswith("cuda")
        results = model.predict(
            frame,
            classes=list(self.yolo_classes),
            conf=self.model_confidence,
            device=device,
            half=use_half_precision,
            verbose=False,
        )

        if not results:
            return DetectionStats(
                player_count=0,
                ball_count=0,
                max_player_confidence=0,
                max_ball_confidence=0,
                ball_center=None,
            )

        boxes = getattr(results[0], "boxes", None)

        if boxes is None or boxes.cls is None or boxes.conf is None:
            return DetectionStats(
                player_count=0,
                ball_count=0,
                max_player_confidence=0,
                max_ball_confidence=0,
                ball_center=None,
            )

        classes = boxes.cls.cpu().numpy().astype(int)
        confidences = boxes.conf.cpu().numpy()
        player_confidences = confidences[classes == 0]
        ball_confidences = confidences[classes == 32]
        ball_center = self._most_confident_ball_center(boxes, classes, ball_confidences)

        return DetectionStats(
            player_count=int(player_confidences.size),
            ball_count=int(ball_confidences.size),
            max_player_confidence=self._max_confidence(player_confidences),
            max_ball_confidence=self._max_confidence(ball_confidences),
            ball_center=ball_center,
        )

    def _most_confident_ball_center(
        self,
        boxes: Any,
        classes: np.ndarray,
        ball_confidences: np.ndarray,
    ) -> tuple[float, float] | None:
        if ball_confidences.size == 0 or getattr(boxes, "xyxy", None) is None:
            return None

        ball_boxes = boxes.xyxy.cpu().numpy()[classes == 32]
        best_index = int(np.argmax(ball_confidences))
        x1, y1, x2, y2 = ball_boxes[best_index]

        return ((float(x1) + float(x2)) / 2, (float(y1) + float(y2)) / 2)

    def _ball_movement(
        self,
        previous_ball_center: tuple[float, float] | None,
        current_ball_center: tuple[float, float] | None,
        frame: np.ndarray,
    ) -> float | None:
        if previous_ball_center is None or current_ball_center is None:
            return None

        dx = current_ball_center[0] - previous_ball_center[0]
        dy = current_ball_center[1] - previous_ball_center[1]
        frame_height, frame_width = frame.shape[:2]
        diagonal = max(1.0, float((frame_width**2 + frame_height**2) ** 0.5))

        return float((dx**2 + dy**2) ** 0.5 / diagonal)

    def _ai_activity_score(
        self,
        motion_score: float,
        stats: DetectionStats,
        ball_movement: float | None,
    ) -> float:
        if stats.ball_count > 0:
            if ball_movement is not None:
                if ball_movement < self.min_active_ball_movement:
                    return motion_score * 0.25

                return (
                    motion_score * 2
                    + min(ball_movement * 10, 0.25)
                    + stats.max_ball_confidence * 0.02
                )

            return motion_score * 1.1

        if stats.player_count >= 2:
            return motion_score * 1.2 + stats.max_player_confidence * 0.004

        if stats.player_count == 1:
            return motion_score * 0.8

        return motion_score * 0.25

    def _max_confidence(self, confidences: np.ndarray) -> float:
        if confidences.size == 0:
            return 0

        return float(np.max(confidences))

    def _prepare_frame(self, frame: np.ndarray) -> np.ndarray:
        resized = cv2.resize(frame, (320, 180), interpolation=cv2.INTER_AREA)
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)

        return cv2.GaussianBlur(gray, (7, 7), 0)

    def _motion_score(self, previous_frame: np.ndarray, current_frame: np.ndarray) -> float:
        delta = cv2.absdiff(previous_frame, current_frame)
        threshold = cv2.threshold(delta, 18, 255, cv2.THRESH_BINARY)[1]
        threshold = cv2.morphologyEx(
            threshold,
            cv2.MORPH_OPEN,
            np.ones((3, 3), dtype=np.uint8),
        )

        active_pixels = cv2.countNonZero(threshold)
        total_pixels = threshold.shape[0] * threshold.shape[1]

        return active_pixels / total_pixels

    def _build_activity_segments(
        self,
        samples: list[ActivitySample],
        duration_seconds: float,
    ) -> list[ActivitySegment]:
        threshold = self._activity_threshold(samples)
        active_samples = [sample for sample in samples if sample.score >= threshold]

        if not active_samples:
            return []

        segments: list[ActivitySegment] = []
        current_start = active_samples[0].timestamp_seconds
        current_end = active_samples[0].timestamp_seconds

        for sample in active_samples[1:]:
            gap = sample.timestamp_seconds - current_end

            if gap <= self.max_inactive_gap_seconds:
                current_end = sample.timestamp_seconds
                continue

            self._append_segment(segments, current_start, current_end, duration_seconds)
            current_start = sample.timestamp_seconds
            current_end = sample.timestamp_seconds

        self._append_segment(segments, current_start, current_end, duration_seconds)

        return segments

    def _activity_threshold(self, samples: list[ActivitySample]) -> float:
        scores = np.array([sample.score for sample in samples], dtype=np.float32)
        percentile = float(np.percentile(scores, 65))

        return max(0.003, percentile)

    def _append_segment(
        self,
        segments: list[ActivitySegment],
        start_seconds: float,
        end_seconds: float,
        duration_seconds: float,
    ) -> None:
        padded_start = max(0, start_seconds - self.edge_padding_seconds)
        padded_end = min(duration_seconds, end_seconds + self.edge_padding_seconds)

        if padded_end - padded_start < self.min_rally_seconds:
            return

        segments.append(ActivitySegment(start_seconds=padded_start, end_seconds=padded_end))

    def _single_rally(self, video_probe: VideoProbe) -> list[RallySuggestion]:
        return [
            RallySuggestion(
                id="r1",
                index=1,
                start_time="00:00",
                end_time=self._format_clock(video_probe.duration_seconds),
            )
        ]

    def _format_clock(self, total_seconds: float) -> str:
        rounded_seconds = max(0, round(total_seconds))
        minutes = rounded_seconds // 60
        seconds = rounded_seconds % 60

        return f"{minutes:02d}:{seconds:02d}"


rally_detection_service = RallyDetectionService()
