from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, not_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import Task
from backend.schemas import TaskListResponse, TaskResponse

router = APIRouter(prefix="/api/tasks", tags=["tasks"])
DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=TaskListResponse)
async def get_tasks(
    db: DbSession,
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=50)] = 10,
    task_type: Annotated[int | None, Query()] = None,
    search: Annotated[str | None, Query()] = None,
    filter: Annotated[str | None, Query()] = None,
) -> TaskListResponse:
    q = select(Task)
    count_q = select(func.count(Task.id))

    if task_type is not None:
        q = q.where(Task.task_type == task_type)
        count_q = count_q.where(Task.task_type == task_type)

    if filter == "untyped":
        q = q.where(
            or_(Task.task_type == 0, not_(Task.task_type.between(1, 19)))
        )
        count_q = count_q.where(
            or_(Task.task_type == 0, not_(Task.task_type.between(1, 19)))
        )
    elif filter == "no_answer":
        q = q.where(
            and_(
                Task.task_type.between(1, 12),
                or_(Task.answer.is_(None), Task.answer == ""),
            )
        )
        count_q = count_q.where(
            and_(
                Task.task_type.between(1, 12),
                or_(Task.answer.is_(None), Task.answer == ""),
            )
        )

    if search:
        q = q.where(Task.text.ilike(f"%{search}%"))
        count_q = count_q.where(Task.text.ilike(f"%{search}%"))

    total_result = await db.execute(count_q)
    total = total_result.scalar_one()

    pages = max(1, (total + per_page - 1) // per_page)
    q = q.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(q)
    tasks = [
        TaskResponse.model_validate(task) for task in result.scalars().all()
    ]

    return TaskListResponse(tasks=tasks, total=total, page=page, pages=pages)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, db: DbSession) -> Task:
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Задание не найдено")
    return task
