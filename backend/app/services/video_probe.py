from pathlib import Path

import cv2

from app.core.config import settings
from app.models.analysis import ExtractedFrame, StoredVideo, VideoProbe


class VideoProbeService:
    def __init__(self, frame_dir: Path) -> None:
        self.frame_dir = frame_dir

    def probe(self, stored_video: StoredVideo) -> VideoProbe:
        capture = cv2.VideoCapture(str(stored_video.path))

        if not capture.isOpened():
            raise ValueError("Impossible d'ouvrir la video")

        try:
            fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)
            frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
            width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
            height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
            duration_seconds = frame_count / fps if fps > 0 else 0

            extracted_frames = self._extract_one_frame_per_second(
                capture=capture,
                fps=fps,
                frame_count=frame_count,
                video_id=stored_video.id,
            )

            return VideoProbe(
                width=width,
                height=height,
                fps=round(fps, 2),
                frame_count=frame_count,
                duration_seconds=round(duration_seconds, 2),
                extracted_frames=extracted_frames,
            )
        finally:
            capture.release()

    def _extract_one_frame_per_second(
        self,
        capture: cv2.VideoCapture,
        fps: float,
        frame_count: int,
        video_id: str,
    ) -> list[ExtractedFrame]:
        if fps <= 0 or frame_count <= 0:
            return []

        target_dir = self.frame_dir / video_id
        target_dir.mkdir(parents=True, exist_ok=True)

        extracted_frames: list[ExtractedFrame] = []
        duration_seconds = int(frame_count / fps)

        for second in range(duration_seconds + 1):
            frame_index = min(frame_count - 1, round(second * fps))
            capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
            success, frame = capture.read()

            if not success:
                continue

            frame_path = target_dir / f"frame_{second:04d}.jpg"
            cv2.imwrite(str(frame_path), frame)
            extracted_frames.append(
                ExtractedFrame(
                    frame_index=frame_index,
                    timestamp_seconds=float(second),
                    file_path=frame_path,
                )
            )

        return extracted_frames


video_probe_service = VideoProbeService(settings.frame_dir)
