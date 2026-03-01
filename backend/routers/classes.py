from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_current_user, require_role
from backend.database import get_db
from backend.models import ClassMember, SchoolClass, User
from backend.schemas import (
    ClassAddMember,
    ClassCreate,
    ClassMemberResponse,
    ClassResponse,
)

router = APIRouter(prefix="/api/classes", tags=["classes"])
AdminUser = Annotated[User, Depends(require_role("admin"))]
CurrentUser = Annotated[User, Depends(get_current_user)]
DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.post("", response_model=ClassResponse)
async def create_class(
    data: ClassCreate,
    current_user: AdminUser,
    db: DbSession,
) -> ClassResponse:
    sc = SchoolClass(
        name=data.name,
        description=data.description,
        created_by=current_user.id,
    )
    db.add(sc)
    await db.commit()
    await db.refresh(sc)
    return _class_to_response(sc)


@router.get("", response_model=list[ClassResponse])
async def get_classes(
    current_user: CurrentUser,
    db: DbSession,
) -> list[ClassResponse]:
    if current_user.role == "admin":
        result = await db.execute(select(SchoolClass))
    elif current_user.role == "teacher":
        result = await db.execute(
            select(SchoolClass)
            .join(ClassMember)
            .where(
                ClassMember.user_id == current_user.id,
                ClassMember.role == "teacher",
            )
        )
    else:
        result = await db.execute(
            select(SchoolClass)
            .join(ClassMember)
            .where(
                ClassMember.user_id == current_user.id,
            )
        )
    classes = result.scalars().all()
    return [_class_to_response(c) for c in classes]


@router.get("/{class_id}", response_model=ClassResponse)
async def get_class(
    class_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> ClassResponse:
    result = await db.execute(
        select(SchoolClass).where(SchoolClass.id == class_id)
    )
    sc = result.scalar_one_or_none()
    if not sc:
        raise HTTPException(404, "Класс не найден")
    return _class_to_response(sc)


@router.post("/{class_id}/members", response_model=ClassMemberResponse)
async def add_member(
    class_id: int,
    data: ClassAddMember,
    current_user: AdminUser,
    db: DbSession,
) -> ClassMemberResponse:
    result = await db.execute(
        select(SchoolClass).where(SchoolClass.id == class_id)
    )
    sc = result.scalar_one_or_none()
    if not sc:
        raise HTTPException(404, "Класс не найден")

    user_result = await db.execute(select(User).where(User.id == data.user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Пользователь не найден")

    result = await db.execute(
        select(ClassMember).where(
            ClassMember.class_id == class_id,
            ClassMember.user_id == data.user_id,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(400, "Пользователь уже в классе")

    member = ClassMember(
        class_id=class_id,
        user_id=data.user_id,
        role=data.role,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)

    return ClassMemberResponse(
        id=member.id,
        user_id=user.id,
        username=user.username,
        email=user.email,
        role=member.role,
    )


@router.delete("/{class_id}/members/{user_id}")
async def remove_member(
    class_id: int,
    user_id: int,
    current_user: AdminUser,
    db: DbSession,
) -> dict[str, bool]:
    result = await db.execute(
        select(ClassMember).where(
            ClassMember.class_id == class_id,
            ClassMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(404, "Участник не найден")
    await db.delete(member)
    await db.commit()
    return {"ok": True}


@router.delete("/{class_id}")
async def delete_class(
    class_id: int,
    current_user: AdminUser,
    db: DbSession,
) -> dict[str, bool]:
    result = await db.execute(
        select(SchoolClass).where(SchoolClass.id == class_id)
    )
    sc = result.scalar_one_or_none()
    if not sc:
        raise HTTPException(404, "Класс не найден")

    members_result = await db.execute(
        select(ClassMember).where(ClassMember.class_id == class_id)
    )
    for m in members_result.scalars().all():
        await db.delete(m)

    await db.delete(sc)
    await db.commit()
    return {"ok": True}


def _class_to_response(sc: SchoolClass) -> ClassResponse:
    members = []
    for m in sc.members:
        members.append(
            ClassMemberResponse(
                id=m.id,
                user_id=m.user.id,
                username=m.user.username,
                email=m.user.email,
                role=m.role,
            )
        )
    return ClassResponse(
        id=sc.id,
        name=sc.name,
        description=sc.description,
        created_by=sc.created_by,
        created_at=sc.created_at,
        members=members,
    )
