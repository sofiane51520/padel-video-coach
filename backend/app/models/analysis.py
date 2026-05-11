from datetime import datetime, timezone
from enum import StrEnum
from pathlib import Path

from pydantic import BaseModel, Field


class AnalysisStatus(StrEnum):
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class StoredVideo(BaseModel):
    id: str
    original_filename: str
    content_type: str | None = None
    path: Path
    size_bytes: int


class AnalysisJob(BaseModel):
    id: str
    match_id: str | None = None
    status: AnalysisStatus
    progress: int = Field(ge=0, le=100)
    message: str
    video: StoredVideo
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PlayerTrackingSummary(BaseModel):
    player_id: str
    distance_meters: int


class RallySuggestion(BaseModel):
    id: str
    index: int
    start_time: str
    end_time: str


class AnalysisResult(BaseModel):
    analysis_id: str
    match_id: str | None = None
    player_tracking: list[PlayerTrackingSummary]
    rallies: list[RallySuggestion]
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
