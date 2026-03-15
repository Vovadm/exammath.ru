from fastapi import APIRouter

from backend.core.deps import AdminUser, CurrentUser, DbSession
from backend.repositories.class_repo import ClassRepository
from backend.repositories.user_repo import UserRepository
from backend.schemas.class_ import (
    ClassAddMember,
    ClassCreate,
    ClassMemberResponse,
    ClassResponse,
)
from backend.services.class_service import ClassService

router = APIRouter(prefix="/api/classes", tags=["classes"])


def get_service(db: DbSession) -> ClassService:
    return ClassService(
        class_repo=ClassRepository(db), user_repo=UserRepository(db)
    )


@router.post("", response_model=ClassResponse)
async def create_class(
    data: ClassCreate, current_user: AdminUser, db: DbSession
) -> ClassResponse:
    return await get_service(db).create(data, current_user.id)


@router.get("", response_model=list[ClassResponse])
async def get_classes(
    current_user: CurrentUser, db: DbSession
) -> list[ClassResponse]:
    return await get_service(db).get_list(current_user.id, current_user.role)


@router.get("/{class_id}", response_model=ClassResponse)
async def get_class(
    class_id: int, current_user: CurrentUser, db: DbSession
) -> ClassResponse:
    return await get_service(db).get_one(class_id)


@router.post("/{class_id}/members", response_model=ClassMemberResponse)
async def add_member(
    class_id: int, data: ClassAddMember, current_user: AdminUser, db: DbSession
) -> ClassMemberResponse:
    return await get_service(db).add_member(class_id, data)


@router.delete("/{class_id}/members/{user_id}")
async def remove_member(
    class_id: int, user_id: int, current_user: AdminUser, db: DbSession
) -> dict[str, bool]:
    await get_service(db).remove_member(class_id, user_id)
    return {"ok": True}


@router.delete("/{class_id}")
async def delete_class(
    class_id: int, current_user: AdminUser, db: DbSession
) -> dict[str, bool]:
    await get_service(db).delete(class_id)
    return {"ok": True}
