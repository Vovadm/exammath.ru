from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_current_user, hash_password, verify_password
from backend.database import get_db
from backend.models import Solution, User, UserStats
from backend.schemas import (
    ChangePasswordRequest,
    TypeStatItem,
    UserResponse,
    UserStatsResponse,
)

router = APIRouter(prefix="/api/profile", tags=["profile"])
CurrentUser = Annotated[User, Depends(get_current_user)]
DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/stats", response_model=UserStatsResponse)
async def get_my_stats(
    current_user: CurrentUser,
    db: DbSession,
) -> UserStatsResponse:
    return await _get_user_stats(current_user.id, db)


@router.get("/history")
async def get_history(
    current_user: CurrentUser,
    db: DbSession,
) -> list[dict[str, object]]:
    return await _get_user_history(current_user.id, db)


@router.get("/type-stats", response_model=list[TypeStatItem])
async def get_my_type_stats(
    current_user: CurrentUser,
    db: DbSession,
) -> list[TypeStatItem]:
    return await _get_type_stats(current_user.id, db)


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, bool]:
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(400, "Неверный текущий пароль")
    current_user.hashed_password = hash_password(data.new_password)
    await db.commit()
    return {"ok": True}


@router.delete("/me")
async def delete_account(
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, bool]:
    await db.delete(current_user)
    await db.commit()
    return {"ok": True}


@router.get("/user/{user_id}", response_model=UserResponse)
async def get_user_profile(
    user_id: int,
    db: DbSession,
) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Пользователь не найден")
    return user


@router.get("/user/{user_id}/stats", response_model=UserStatsResponse)
async def get_user_stats(
    user_id: int,
    db: DbSession,
) -> UserStatsResponse:
    result = await db.execute(select(User).where(User.id == user_id))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Пользователь не найден")
    return await _get_user_stats(user_id, db)


@router.get("/user/{user_id}/type-stats", response_model=list[TypeStatItem])
async def get_user_type_stats(
    user_id: int,
    db: DbSession,
) -> list[TypeStatItem]:
    result = await db.execute(select(User).where(User.id == user_id))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Пользователь не найден")
    return await _get_type_stats(user_id, db)


@router.get("/user/{user_id}/history")
async def get_user_history(
    user_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> list[dict[str, object]]:
    if (
        current_user.role not in ("admin", "teacher")
        and current_user.id != user_id
    ):
        raise HTTPException(403, "Можно смотреть только свою историю")
    return await _get_user_history(user_id, db)


async def _get_user_stats(user_id: int, db: AsyncSession) -> UserStatsResponse:
    result = await db.execute(
        select(UserStats).where(UserStats.user_id == user_id)
    )
    stats = result.scalar_one_or_none()
    if not stats:
        return UserStatsResponse()

    accuracy = 0.0
    if stats.total_attempts > 0:
        accuracy = round(
            stats.correct_attempts / stats.total_attempts * 100, 1
        )

    return UserStatsResponse(
        total_attempts=stats.total_attempts,
        correct_attempts=stats.correct_attempts,
        tasks_solved=stats.tasks_solved,
        accuracy=accuracy,
        streak_current=stats.streak_current,
        streak_max=stats.streak_max,
        last_activity=stats.last_activity,
        stats_by_type=stats.stats_by_type or {},
    )


async def _get_type_stats(
    user_id: int, db: AsyncSession
) -> list[TypeStatItem]:
    result = await db.execute(
        select(UserStats).where(UserStats.user_id == user_id)
    )
    stats = result.scalar_one_or_none()
    if not stats or not stats.stats_by_type:
        return []

    items: list[TypeStatItem] = []
    for key, val in stats.stats_by_type.items():
        attempts = val.get("attempts", 0)
        correct = val.get("correct", 0)
        success_rate = (
            round(correct / attempts * 100, 1) if attempts > 0 else 0.0
        )
        items.append(
            TypeStatItem(
                task_type=int(key),
                attempts=attempts,
                correct=correct,
                success_rate=success_rate,
            )
        )
    return sorted(items, key=lambda x: x.task_type)


async def _get_user_history(
    user_id: int,
    db: AsyncSession,
) -> list[dict[str, object]]:
    result = await db.execute(
        select(Solution)
        .where(Solution.user_id == user_id)
        .order_by(Solution.created_at.desc())
        .limit(50)
    )
    solutions = result.scalars().all()
    return [
        {
            "id": s.id,
            "task_id": s.task_id,
            "answer": s.answer,
            "is_correct": s.is_correct,
            "created_at": s.created_at.isoformat(),
        }
        for s in solutions
    ]
