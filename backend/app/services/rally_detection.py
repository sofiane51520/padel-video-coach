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


@dataclass(frozen=True)
class ActivitySegment:
    start_seconds: float
    end_seconds: float


class RallyDetectionService:
    sample_rate_fps = 4
    min_rally_seconds = 2.0
    max_inactive_gap_seconds = 1.5
    edge_padding_seconds = 0.8
    yolo_classes = (0, 32)

    def __init__(
        self,
        model_enabled: bool = settings.yolo_enabled,
        model_path: Path = settings.yolo_model_path,
        model_name: str = settings.yolo_model_name,
        model_confidence: float = settings.yolo_confidence,
    ) -> None:
        self.model_enabled = model_enabled
        self.model_path = model_path
        self.model_name = model_name
        self.model_confidence = model_confidence
        self._model: Any | None = None
        self._model_load_failed = False

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
                detected_objects += stats.player_count + stats.ball_count
                samples.append(
                    ActivitySample(
                        timestamp_seconds=timestamp_seconds,
                        score=self._ai_activity_score(motion_score, stats),
                    )
                )
                previous_frame = prepared_frame
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
        except Exception:
            self._model_load_failed = True
            return None

        return self._model

    def _detect_objects(self, model: Any, frame: np.ndarray) -> DetectionStats:
        results = model.predict(
            frame,
            classes=list(self.yolo_classes),
            conf=self.model_confidence,
            verbose=False,
        )

        if not results:
            return DetectionStats(
                player_count=0,
                ball_count=0,
                max_player_confidence=0,
                max_ball_confidence=0,
            )

        boxes = getattr(results[0], "boxes", None)

        if boxes is None or boxes.cls is None or boxes.conf is None:
            return DetectionStats(
                player_count=0,
                ball_count=0,
                max_player_confidence=0,
                max_ball_confidence=0,
            )

        classes = boxes.cls.cpu().numpy().astype(int)
        confidences = boxes.conf.cpu().numpy()
        player_confidences = confidences[classes == 0]
        ball_confidences = confidences[classes == 32]

        return DetectionStats(
            player_count=int(player_confidences.size),
            ball_count=int(ball_confidences.size),
            max_player_confidence=self._max_confidence(player_confidences),
            max_ball_confidence=self._max_confidence(ball_confidences),
        )

    def _ai_activity_score(self, motion_score: float, stats: DetectionStats) -> float:
        if stats.ball_count > 0:
            return motion_score * 2 + stats.max_ball_confidence * 0.05

        if stats.player_count >= 2:
            return motion_score * 1.4 + stats.max_player_confidence * 0.004

        if stats.player_count == 1:
            return motion_score

        return motion_score * 0.35

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
