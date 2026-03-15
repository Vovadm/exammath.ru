from fastapi import APIRouter, HTTPException

from backend.auth import hash_password, verify_password
from backend.core.deps import CurrentUser, DbSession
from backend.repositories.user_repo import UserRepository
from backend.schemas.auth import ChangePasswordRequest, UserResponse
from backend.schemas.stats import TypeStatItem, UserStatsResponse
from backend.services.stats_service import StatsService

router = APIRouter(prefix="/api/profile", tags=["profile"])


def get_stats_service(db: DbSession) -> StatsService:
    return StatsService(user_repo=UserRepository(db))


@router.get("/stats", response_model=UserStatsResponse)
async def get_my_stats(
    current_user: CurrentUser, db: DbSession
) -> UserStatsResponse:
    return await get_stats_service(db).get_user_stats(current_user.id)


@router.get("/history")
async def get_history(current_user: CurrentUser, db: DbSession) -> list[dict]:
    return await get_stats_service(db).get_history(current_user.id)


@router.get("/type-stats", response_model=list[TypeStatItem])
async def get_my_type_stats(
    current_user: CurrentUser, db: DbSession
) -> list[TypeStatItem]:
    return await get_stats_service(db).get_type_stats(current_user.id)


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest, current_user: CurrentUser, db: DbSession
) -> dict[str, bool]:
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(400, "Неверный текущий пароль")
    current_user.hashed_password = hash_password(data.new_password)
    await UserRepository(db).save(current_user)
    return {"ok": True}


@router.delete("/me")
async def delete_account(
    current_user: CurrentUser, db: DbSession
) -> dict[str, bool]:
    await UserRepository(db).delete(current_user)
    return {"ok": True}


@router.get("/user/{user_id}", response_model=UserResponse)
async def get_user_profile(user_id: int, db: DbSession) -> UserResponse:
    user = await UserRepository(db).get_by_id(user_id)
    if not user:
        raise HTTPException(404, "Пользователь не найден")
    return UserResponse.model_validate(user)


@router.get("/user/{user_id}/stats", response_model=UserStatsResponse)
async def get_user_stats(user_id: int, db: DbSession) -> UserStatsResponse:
    repo = UserRepository(db)
    if not await repo.get_by_id(user_id):
        raise HTTPException(404, "Пользователь не найден")
    return await get_stats_service(db).get_user_stats(user_id)


@router.get("/user/{user_id}/type-stats", response_model=list[TypeStatItem])
async def get_user_type_stats(
    user_id: int, db: DbSession
) -> list[TypeStatItem]:
    repo = UserRepository(db)
    if not await repo.get_by_id(user_id):
        raise HTTPException(404, "Пользователь не найден")
    return await get_stats_service(db).get_type_stats(user_id)


@router.get("/user/{user_id}/history")
async def get_user_history(
    user_id: int, current_user: CurrentUser, db: DbSession
) -> list[dict]:
    if (
        current_user.role not in ("admin", "teacher")
        and current_user.id != user_id
    ):
        raise HTTPException(403, "Можно смотреть только свою историю")
    return await get_stats_service(db).get_history(user_id)
