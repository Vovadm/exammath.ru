from typing import Annotated

from fastapi import APIRouter, HTTPException, Depends

from backend.core.deps import DbSession
from backend.repositories.task_repo import TaskRepository
from backend.schemas.task import TaskListResponse, TaskResponse, TaskSearchQuery

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.get("", response_model=TaskListResponse)
async def get_tasks(
    query: Annotated[TaskSearchQuery, Depends()],
    db: DbSession,
) -> TaskListResponse:
    return await TaskRepository(db).get_paginated(
        page=query.page,
        per_page=query.per_page,
        task_type=query.task_type,
        search=query.search,
        filter=query.filter,
    )

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, db: DbSession) -> TaskResponse:
    task = await TaskRepository(db).get_by_id(task_id)
    if not task:
        raise HTTPException(404, "Задание не найдено")
    return TaskResponse.model_validate(task)