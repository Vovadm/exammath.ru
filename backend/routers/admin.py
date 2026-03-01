from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import require_role
from backend.database import get_db
from backend.models import Task, User
from backend.schemas import TaskResponse, TaskUpdate, UserResponse

router = APIRouter(prefix="/api/admin", tags=["admin"])
AdminUser = Annotated[User, Depends(require_role("admin"))]
DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    data: TaskUpdate,
    current_user: AdminUser,
    db: DbSession,
) -> Task:
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Задание не найдено")

    if data.text is not None:
        task.text = data.text
    if data.task_type is not None:
        task.task_type = data.task_type
    if data.answer is not None:
        task.answer = data.answer
    if data.hint is not None:
        task.hint = data.hint

    await db.commit()
    await db.refresh(task)
    return task


@router.get("/users", response_model=list[UserResponse])
async def get_users(
    current_user: AdminUser,
    db: DbSession,
) -> list[User]:
    result = await db.execute(select(User))
    return list(result.scalars().all())


@router.put("/users/{user_id}/role")
async def set_role(
    user_id: int,
    role: str,
    current_user: AdminUser,
    db: DbSession,
) -> dict[str, bool]:
    if role not in ("admin", "teacher", "student"):
        raise HTTPException(400, "Недопустимая роль")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Пользователь не найден")
    user.role = role
    await db.commit()
    return {"ok": True}


@router.get("/stats")
async def get_stats(
    current_user: AdminUser,
    db: DbSession,
) -> dict[str, object]:
    total_tasks_r = await db.execute(select(func.count(Task.id)))
    total_users_r = await db.execute(select(func.count(User.id)))

    tasks_by_type = {}
    for t in range(0, 20):
        count_r = await db.execute(
            select(func.count(Task.id)).where(Task.task_type == t)
        )
        count = count_r.scalar_one()
        if count > 0:
            tasks_by_type[str(t)] = count

    return {
        "total_tasks": total_tasks_r.scalar_one(),
        "total_users": total_users_r.scalar_one(),
        "tasks_by_type": tasks_by_type,
    }
