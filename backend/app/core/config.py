from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Padel Video Coach API"
    app_env: str = "local"
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:8090", "http://localhost:8081"]
    )
    upload_dir: Path = Path(".data/uploads")
    frame_dir: Path = Path(".data/frames")
    model_dir: Path = Path(".data/models")
    yolo_enabled: bool = True
    yolo_model_name: str = "yolo11n.pt"
    yolo_model_path: Path = Path(".data/models/yolo11n.pt")
    yolo_confidence: float = 0.25

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.frame_dir.mkdir(parents=True, exist_ok=True)
    settings.model_dir.mkdir(parents=True, exist_ok=True)
    return settings


settings = get_settings()
