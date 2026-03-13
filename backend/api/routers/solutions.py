from fastapi import APIRouter, File, UploadFile
from typing import Annotated

from backend.core.deps import (
    CurrentUser,
    DbSession,
    TeacherOrAdmin as AdminOrTeacher,
)
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
Upload = Annotated[UploadFile, File(...)]


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
    solution_id: int, file: Upload, current_user: CurrentUser, db: DbSession
) -> dict:
    return await get_service(db).upload_file(
        solution_id, current_user.id, file
    )
