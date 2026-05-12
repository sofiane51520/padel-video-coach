import time
from datetime import datetime, timezone
from uuid import uuid4

from app.models.analysis import (
    AnalysisMetadata,
    AnalysisJob,
    AnalysisResult,
    AnalysisStatus,
    PlayerTrackingSummary,
    StoredVideo,
    VideoProbe,
)
from app.services.rally_generation import rally_generation_service
from app.services.video_probe import video_probe_service


class AnalysisService:
    def __init__(self) -> None:
        self.jobs: dict[str, AnalysisJob] = {}
        self.results: dict[str, AnalysisResult] = {}

    def create_job(
        self,
        stored_video: StoredVideo,
        match_id: str | None,
        metadata: AnalysisMetadata,
    ) -> AnalysisJob:
        job = AnalysisJob(
            id=str(uuid4()),
            match_id=match_id,
            status=AnalysisStatus.queued,
            progress=0,
            message="Analyse en attente",
            video=stored_video,
            metadata=metadata,
        )
        self.jobs[job.id] = job
        return job

    def get_job(self, analysis_id: str) -> AnalysisJob | None:
        return self.jobs.get(analysis_id)

    def get_result(self, analysis_id: str) -> AnalysisResult | None:
        return self.results.get(analysis_id)

    def run_simulated_analysis(self, analysis_id: str) -> None:
        job = self.jobs.get(analysis_id)

        if not job:
            return

        try:
            self._update_job(
                analysis_id,
                status=AnalysisStatus.processing,
                progress=20,
                message="Extraction des frames",
            )
            video_probe = video_probe_service.probe(job.video)
            self._update_job(
                analysis_id,
                status=AnalysisStatus.processing,
                progress=55,
                message="Detection des joueurs",
            )
            time.sleep(0.4)
            self._update_job(
                analysis_id,
                status=AnalysisStatus.processing,
                progress=82,
                message="Preparation des echanges",
            )
            time.sleep(0.4)

            self.results[analysis_id] = self._create_placeholder_result(job, video_probe)
            self._update_job(
                analysis_id,
                status=AnalysisStatus.completed,
                progress=100,
                message="Analyse terminee",
            )
        except Exception as exc:
            self._update_job(
                analysis_id,
                status=AnalysisStatus.failed,
                progress=0,
                message=f"Analyse echouee: {exc}",
            )

    def _update_job(
        self,
        analysis_id: str,
        status: AnalysisStatus,
        progress: int,
        message: str,
    ) -> None:
        current_job = self.jobs[analysis_id]
        self.jobs[analysis_id] = current_job.model_copy(
            update={
                "status": status,
                "progress": progress,
                "message": message,
                "updated_at": datetime.now(timezone.utc),
            }
        )

    def _create_placeholder_result(self, job: AnalysisJob, video_probe: VideoProbe) -> AnalysisResult:
        players = job.metadata.players
        player_ids = [player.id for player in players] or ["p1", "p2", "p3", "p4"]

        return AnalysisResult(
            analysis_id=job.id,
            match_id=job.match_id,
            video_probe=video_probe,
            player_tracking=[
                PlayerTrackingSummary(player_id=player_id, distance_meters=0)
                for player_id in player_ids
            ],
            rallies=rally_generation_service.generate(video_probe),
        )


analysis_service = AnalysisService()
