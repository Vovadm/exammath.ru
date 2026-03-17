from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from backend.core.deps import DbSession
from backend.repositories.task_repo import TaskRepository
from backend.schemas.task import TaskListResponse, TaskResponse

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("", response_model=TaskListResponse)
async def get_tasks(
    db: DbSession,
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=50)] = 10,
    task_type: Annotated[int | None, Query()] = None,
    search: Annotated[str | None, Query()] = None,
    filter: Annotated[str | None, Query()] = None,
) -> TaskListResponse:
    return await TaskRepository(db).get_paginated(
        page=page,
        per_page=per_page,
        task_type=task_type,
        search=search,
        filter=filter,
    )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, db: DbSession) -> TaskResponse:
    task = await TaskRepository(db).get_by_id(task_id)
    if not task:
        raise HTTPException(404, "Задание не найдено")
    return TaskResponse.model_validate(task)
