from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

from app.models.analysis import RallySuggestion, StoredVideo, VideoProbe


@dataclass(frozen=True)
class ActivitySample:
    timestamp_seconds: float
    score: float


@dataclass(frozen=True)
class ActivitySegment:
    start_seconds: float
    end_seconds: float


class RallyDetectionService:
    sample_rate_fps = 4
    min_rally_seconds = 2.0
    max_inactive_gap_seconds = 1.5
    edge_padding_seconds = 0.8

    def detect(self, stored_video: StoredVideo, video_probe: VideoProbe) -> list[RallySuggestion]:
        samples = self._sample_activity(stored_video.path, video_probe)

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

    def _sample_activity(self, video_path: Path, video_probe: VideoProbe) -> list[ActivitySample]:
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
