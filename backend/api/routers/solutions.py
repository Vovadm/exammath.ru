import os

from fastapi import APIRouter, HTTPException, UploadFile

from backend.core.deps import CurrentUser, DbSession
from backend.core.deps import TeacherOrAdmin as AdminOrTeacher
from backend.repositories.solution_repo import SolutionRepository
from backend.repositories.task_repo import TaskRepository
from backend.repositories.user_repo import UserRepository
from backend.schemas.solution import (
    CheckAnswerRequest,
    CheckAnswerResponse,
    SolutionCreate,
    SolutionResponse,
)
from backend.services.solution_service import SolutionService

router = APIRouter(prefix="/api/solutions", tags=["solutions"])


def get_service(db: DbSession) -> SolutionService:
    return SolutionService(
        solution_repo=SolutionRepository(db),
        task_repo=TaskRepository(db),
        user_repo=UserRepository(db),
    )


@router.post("/check", response_model=CheckAnswerResponse)
async def check_answer(
    data: CheckAnswerRequest, current_user: CurrentUser, db: DbSession
) -> CheckAnswerResponse:
    return await get_service(db).check_answer(
        data.task_id, data.answer, current_user.id
    )


@router.post("", response_model=SolutionResponse)
async def save_solution(
    data: SolutionCreate, current_user: CurrentUser, db: DbSession
) -> SolutionResponse:
    return await get_service(db).upsert(data, current_user.id)


@router.get("/task/{task_id}", response_model=list[SolutionResponse])
async def get_my_solutions(
    task_id: int, current_user: CurrentUser, db: DbSession
) -> list[SolutionResponse]:
    return await get_service(db).get_my_solutions(current_user.id, task_id)


@router.get("/task/{task_id}/all", response_model=list[SolutionResponse])
async def get_all_solutions_for_task(
    task_id: int, current_user: AdminOrTeacher, db: DbSession
) -> list[SolutionResponse]:
    return await get_service(db).get_all_for_task(task_id)


@router.post("/upload/{solution_id}")
async def upload_file(
    solution_id: int,
    file: UploadFile,
    current_user: CurrentUser,
    db: DbSession,
) -> dict:
    if not file.filename:
        raise HTTPException(400, "Файл не имеет имени")

    safe_filename = os.path.basename(file.filename)
    if safe_filename != file.filename or not safe_filename.strip():
        raise HTTPException(400, "Недопустимое имя файла")

    max_size = 10 * 1024 * 1024
    size = 0
    while chunk := await file.read(8192):
        size += len(chunk)
        if size > max_size:
            raise HTTPException(413, "Файл слишком большой")

    await file.seek(0)
    return await get_service(db).upload_file(
        solution_id, current_user.id, file
    )
