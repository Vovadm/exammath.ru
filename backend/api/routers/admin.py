from typing import Annotated

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select

from backend.core.deps import AdminUser, DbSession
from backend.domain.models.task import Task
from backend.domain.models.user import User
from backend.repositories.task_repo import TaskRepository
from backend.repositories.user_repo import UserRepository
from backend.schemas.auth import UserResponse
from backend.schemas.task import TaskResponse, TaskUpdate

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int, data: TaskUpdate, current_user: AdminUser, db: DbSession
) -> TaskResponse:
    repo = TaskRepository(db)
    task = await repo.get_by_id(task_id)
    if not task:
        raise HTTPException(404, "Задание не найдено")
    updated = await repo.update(
        task,
        text=data.text,
        task_type=data.task_type,
        answer=data.answer,
        hint=data.hint,
    )
    return TaskResponse.model_validate(updated)


@router.get("/users", response_model=list[UserResponse])
async def get_users(
    current_user: AdminUser,
    db: DbSession,
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=1000)] = 50,
) -> list[UserResponse]:
    start = (page - 1) * per_page
    result = await db.execute(select(User).offset(start).limit(per_page))
    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]


@router.put("/users/{user_id}/role")
async def set_role(
    user_id: int, role: str, current_user: AdminUser, db: DbSession
) -> dict[str, bool]:
    if role not in ("admin", "teacher", "student"):
        raise HTTPException(400, "Недопустимая роль")
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(404, "Пользователь не найден")
    user.role = role
    await repo.save(user)
    return {"ok": True}


@router.get("/stats")
async def get_stats(current_user: AdminUser, db: DbSession) -> dict:
    total_tasks = (await db.execute(select(func.count(Task.id)))).scalar_one()
    total_users = (await db.execute(select(func.count(User.id)))).scalar_one()

    rows = await db.execute(
        select(Task.task_type, func.count(Task.id))
        .group_by(Task.task_type)
        .having(func.count(Task.id) > 0)
    )
    tasks_by_type = {str(task_type): count for task_type, count in rows.all()}

    return {
        "total_tasks": total_tasks,
        "total_users": total_users,
        "tasks_by_type": tasks_by_type,
    }
