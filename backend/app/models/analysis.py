from datetime import datetime, timezone
from enum import StrEnum
from pathlib import Path

from pydantic import AliasChoices, BaseModel, Field


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


class CalibrationPointInput(BaseModel):
    id: str
    label: str
    court_x: float | None = Field(
        default=None,
        ge=0,
        le=1,
        validation_alias=AliasChoices("court_x", "courtX"),
    )
    court_y: float | None = Field(
        default=None,
        ge=0,
        le=1,
        validation_alias=AliasChoices("court_y", "courtY"),
    )
    x: float = Field(ge=0, le=1)
    y: float = Field(ge=0, le=1)


class CalibrationSuggestion(BaseModel):
    points: list[CalibrationPointInput]
    confidence: float = Field(ge=0, le=1)
    method: str
    frame_time_seconds: float


class PlayerInput(BaseModel):
    id: str
    label: str
    team: str


class AnalysisMetadata(BaseModel):
    calibration_points: list[CalibrationPointInput] = Field(default_factory=list)
    players: list[PlayerInput] = Field(default_factory=list)


class AnalysisJob(BaseModel):
    id: str
    match_id: str | None = None
    status: AnalysisStatus
    progress: int = Field(ge=0, le=100)
    message: str
    video: StoredVideo
    metadata: AnalysisMetadata = Field(default_factory=AnalysisMetadata)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PlayerTrackingSummary(BaseModel):
    player_id: str
    distance_meters: int


class ExtractedFrame(BaseModel):
    frame_index: int
    timestamp_seconds: float
    file_path: Path


class VideoProbe(BaseModel):
    width: int
    height: int
    fps: float
    frame_count: int
    duration_seconds: float
    extracted_frames: list[ExtractedFrame]


class RallySuggestion(BaseModel):
    id: str
    index: int
    start_time: str
    end_time: str


class AnalysisResult(BaseModel):
    analysis_id: str
    match_id: str | None = None
    video_probe: VideoProbe
    player_tracking: list[PlayerTrackingSummary]
    rallies: list[RallySuggestion]
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
