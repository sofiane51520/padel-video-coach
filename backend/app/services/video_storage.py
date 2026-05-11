from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import settings
from app.models.analysis import StoredVideo


class VideoStorage:
    def __init__(self, upload_dir: Path) -> None:
        self.upload_dir = upload_dir

    async def save(self, video: UploadFile) -> StoredVideo:
        video_id = str(uuid4())
        suffix = Path(video.filename or "video.mp4").suffix or ".mp4"
        target_path = self.upload_dir / f"{video_id}{suffix}"
        size_bytes = 0

        with target_path.open("wb") as output:
            while chunk := await video.read(1024 * 1024):
                size_bytes += len(chunk)
                output.write(chunk)

        await video.close()

        return StoredVideo(
            id=video_id,
            original_filename=video.filename or "video",
            content_type=video.content_type,
            path=target_path,
            size_bytes=size_bytes,
        )


video_storage = VideoStorage(settings.upload_dir)
