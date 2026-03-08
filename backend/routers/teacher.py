from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import require_role
from backend.database import get_db
from backend.models import (
    ClassMember,
    SchoolClass,
    Task,
    User,
    Variant,
    VariantItem,
)
from backend.schemas import (
    ClassMemberResponse,
    ClassResponse,
    TaskResponse,
    UserResponse,
    VariantCreate,
    VariantResponse,
)

router = APIRouter(prefix="/api/teacher", tags=["teacher"])
TeacherOrAdmin = Annotated[User, Depends(require_role("admin", "teacher"))]
DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/classes", response_model=list[ClassResponse])
async def get_my_classes(
    current_user: TeacherOrAdmin,
    db: DbSession,
) -> list[ClassResponse]:
    if current_user.role == "admin":
        result = await db.execute(select(SchoolClass))
        classes = result.scalars().all()
    else:
        result = await db.execute(
            select(SchoolClass)
            .join(ClassMember)
            .where(
                ClassMember.user_id == current_user.id,
                ClassMember.role == "teacher",
            )
        )
        classes = result.scalars().all()

    return [
        ClassResponse(
            id=c.id,
            name=c.name,
            description=c.description,
            created_by=c.created_by,
            created_at=c.created_at,
            members=[
                ClassMemberResponse(
                    id=m.id,
                    user_id=m.user_id,
                    username=m.user.username,
                    email=m.user.email,
                    role=m.role,
                )
                for m in c.members
            ],
        )
        for c in classes
    ]


@router.get("/classes/{class_id}/students", response_model=list[UserResponse])
async def get_class_students(
    class_id: int,
    current_user: TeacherOrAdmin,
    db: DbSession,
) -> list[UserResponse]:
    sc_result = await db.execute(
        select(SchoolClass).where(SchoolClass.id == class_id)
    )
    sc = sc_result.scalar_one_or_none()
    if not sc:
        raise HTTPException(404, "Класс не найден")

    if current_user.role == "teacher":
        member_check = await db.execute(
            select(ClassMember).where(
                ClassMember.class_id == class_id,
                ClassMember.user_id == current_user.id,
                ClassMember.role == "teacher",
            )
        )
        if not member_check.scalar_one_or_none():
            raise HTTPException(403, "Нет доступа к этому классу")

    result = await db.execute(
        select(User)
        .join(ClassMember)
        .where(
            ClassMember.class_id == class_id,
            ClassMember.role == "student",
        )
    )
    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]


@router.post("/variants", response_model=VariantResponse)
async def create_variant(
    data: VariantCreate,
    current_user: TeacherOrAdmin,
    db: DbSession,
) -> VariantResponse:
    variant = Variant(
        title=data.title,
        description=data.description,
        created_by=current_user.id,
        class_id=data.class_id,
        is_public=data.is_public,
    )
    db.add(variant)
    await db.commit()
    await db.refresh(variant)

    for i, task_id in enumerate(data.task_ids):
        result = await db.execute(select(Task).where(Task.id == task_id))
        task = result.scalar_one_or_none()
        if not task:
            raise HTTPException(400, f"Задание {task_id} не найдено")
        item = VariantItem(variant_id=variant.id, task_id=task_id, position=i)
        db.add(item)

    await db.commit()
    await db.refresh(variant)

    tasks: list[TaskResponse] = []
    for item in variant.items:
        result = await db.execute(select(Task).where(Task.id == item.task_id))
        task_obj = result.scalar_one_or_none()
        if task_obj:
            tasks.append(TaskResponse.model_validate(task_obj))

    return VariantResponse(
        id=variant.id,
        title=variant.title,
        description=variant.description,
        created_by=variant.created_by,
        class_id=variant.class_id,
        is_public=variant.is_public,
        created_at=variant.created_at,
        tasks=tasks,
    )


@router.get("/variants", response_model=list[VariantResponse])
async def get_my_variants(
    current_user: TeacherOrAdmin,
    db: DbSession,
) -> list[VariantResponse]:
    if current_user.role == "admin":
        result = await db.execute(select(Variant))
    else:
        result = await db.execute(
            select(Variant).where(Variant.created_by == current_user.id)
        )
    variants = result.scalars().all()

    responses: list[VariantResponse] = []
    for v in variants:
        tasks: list[TaskResponse] = []
        for item in v.items:
            t_result = await db.execute(
                select(Task).where(Task.id == item.task_id)
            )
            task_obj = t_result.scalar_one_or_none()
            if task_obj:
                tasks.append(TaskResponse.model_validate(task_obj))
        responses.append(
            VariantResponse(
                id=v.id,
                title=v.title,
                description=v.description,
                created_by=v.created_by,
                class_id=v.class_id,
                is_public=v.is_public,
                created_at=v.created_at,
                tasks=tasks,
            )
        )
    return responses


@router.get("/students", response_model=list[dict])
async def get_students(
    current_user: TeacherOrAdmin,
    db: DbSession,
) -> list[dict]:
    if current_user.role == "admin":
        result = await db.execute(select(User).where(User.role == "student"))
        students = result.scalars().all()
    else:
        class_result = await db.execute(
            select(SchoolClass)
            .join(ClassMember)
            .where(
                ClassMember.user_id == current_user.id,
                ClassMember.role == "teacher",
            )
        )
        classes = class_result.scalars().all()
        class_ids = [c.id for c in classes]

        student_ids_result = await db.execute(
            select(ClassMember.user_id).where(
                ClassMember.class_id.in_(class_ids),
                ClassMember.role == "student",
            )
        )
        student_ids = [row[0] for row in student_ids_result.all()]
        result = await db.execute(select(User).where(User.id.in_(student_ids)))
        students = result.scalars().all()

    return [
        {"id": s.id, "username": s.username, "email": s.email}
        for s in students
    ]
