from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile, status

from app.models.analysis import AnalysisJob, AnalysisResult
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
) -> AnalysisJob:
    stored_video = await video_storage.save(video)
    job = analysis_service.create_job(stored_video=stored_video, match_id=match_id)
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
