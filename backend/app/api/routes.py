import json

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile, status
from pydantic import ValidationError

from app.models.analysis import AnalysisJob, AnalysisMetadata, AnalysisResult
from app.services.analysis_service import analysis_service
from app.services.video_storage import video_storage

router = APIRouter()


@router.post(
    "/analyses",
    response_model=AnalysisJob,
    status_code=status.HTTP_202_ACCEPTED,
)
async def create_analysis(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    match_id: str | None = Form(default=None),
    calibration_points: str | None = Form(default=None),
    players: str | None = Form(default=None),
) -> AnalysisJob:
    stored_video = await video_storage.save(video)
    metadata = parse_analysis_metadata(calibration_points=calibration_points, players=players)
    job = analysis_service.create_job(
        stored_video=stored_video,
        match_id=match_id,
        metadata=metadata,
    )
    background_tasks.add_task(analysis_service.run_simulated_analysis, job.id)
    return job


@router.get("/analyses/{analysis_id}", response_model=AnalysisJob)
async def get_analysis(analysis_id: str) -> AnalysisJob:
    job = analysis_service.get_job(analysis_id)

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

    return job


@router.get("/analyses/{analysis_id}/result", response_model=AnalysisResult)
async def get_analysis_result(analysis_id: str) -> AnalysisResult:
    result = analysis_service.get_result(analysis_id)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis result not ready",
        )

    return result


def parse_analysis_metadata(
    calibration_points: str | None,
    players: str | None,
) -> AnalysisMetadata:
    try:
        return AnalysisMetadata.model_validate(
            {
                "calibration_points": parse_json_list(calibration_points, "calibration_points"),
                "players": parse_json_list(players, "players"),
            }
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.errors(),
        ) from exc


def parse_json_list(value: str | None, field_name: str) -> list[object]:
    if not value:
        return []

    try:
        parsed_value = json.loads(value)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} must be valid JSON",
        ) from exc

    if not isinstance(parsed_value, list):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} must be a JSON array",
        )

    return parsed_value
