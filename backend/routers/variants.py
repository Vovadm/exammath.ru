from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_current_user, require_role
from backend.database import get_db
from backend.models import (
    ClassMember,
    Solution,
    Task,
    User,
    Variant,
    VariantItem,
)
from backend.schemas import (
    SolutionFileResponse,
    TaskResponse,
    VariantCreate,
    VariantResponse,
    VariantStudentSolutionResponse,
)

router = APIRouter(prefix="/api/variants", tags=["variants"])
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminOrTeacher = Annotated[User, Depends(require_role("admin", "teacher"))]
DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.post("", response_model=VariantResponse)
async def create_variant(
    data: VariantCreate,
    current_user: AdminOrTeacher,
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
    return await _variant_to_response(variant, db)


@router.get("", response_model=list[VariantResponse])
async def get_variants(
    db: DbSession,
    current_user: CurrentUser,
) -> list[VariantResponse]:
    if current_user.role in ("admin", "teacher"):
        result = await db.execute(select(Variant))
        variants = result.scalars().all()
    else:
        class_result = await db.execute(
            select(ClassMember.class_id).where(
                ClassMember.user_id == current_user.id
            )
        )
        class_ids = [row[0] for row in class_result.all()]

        if not class_ids:
            return []

        result = await db.execute(
            select(Variant).where(Variant.class_id.in_(class_ids))
        )
        variants = result.scalars().all()

    return [await _variant_to_response(v, db) for v in variants]


@router.get("/{variant_id}", response_model=VariantResponse)
async def get_variant(
    variant_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> VariantResponse:
    result = await db.execute(select(Variant).where(Variant.id == variant_id))
    variant = result.scalar_one_or_none()
    if not variant:
        raise HTTPException(404, "Вариант не найден")

    if current_user.role not in ("admin", "teacher"):
        if variant.class_id is not None:
            member_result = await db.execute(
                select(ClassMember).where(
                    ClassMember.user_id == current_user.id,
                    ClassMember.class_id == variant.class_id,
                )
            )
            if not member_result.scalar_one_or_none():
                raise HTTPException(403, "Нет доступа к этому варианту")

    return await _variant_to_response(variant, db)


@router.get(
    "/{variant_id}/student/{student_id}/solutions",
    response_model=list[VariantStudentSolutionResponse],
)
async def get_variant_student_solutions(
    variant_id: int,
    student_id: int,
    current_user: AdminOrTeacher,
    db: DbSession,
) -> list[VariantStudentSolutionResponse]:
    result = await db.execute(select(Variant).where(Variant.id == variant_id))
    variant = result.scalar_one_or_none()
    if not variant:
        raise HTTPException(404, "Вариант не найден")

    student_result = await db.execute(
        select(User).where(User.id == student_id)
    )
    if not student_result.scalar_one_or_none():
        raise HTTPException(404, "Пользователь не найден")

    responses: list[VariantStudentSolutionResponse] = []
    for item in variant.items:
        task_result = await db.execute(
            select(Task).where(Task.id == item.task_id)
        )
        task = task_result.scalar_one_or_none()
        if not task:
            continue

        sol_result = await db.execute(
            select(Solution)
            .where(
                Solution.user_id == student_id,
                Solution.task_id == item.task_id,
            )
            .order_by(Solution.created_at.desc())
        )
        solution = sol_result.scalar_one_or_none()

        if solution:
            files = [
                SolutionFileResponse(
                    id=f.id,
                    filename=f.filename,
                    filepath=f.filepath,
                    file_type=f.file_type,
                )
                for f in (solution.files or [])
            ]
            responses.append(
                VariantStudentSolutionResponse(
                    task_id=item.task_id,
                    task_type=task.task_type,
                    answer=solution.answer,
                    is_correct=solution.is_correct,
                    content=solution.content or [],
                    files=files,
                )
            )
        else:
            responses.append(
                VariantStudentSolutionResponse(
                    task_id=item.task_id,
                    task_type=task.task_type,
                )
            )

    return responses


@router.delete("/{variant_id}")
async def delete_variant(
    variant_id: int,
    current_user: AdminOrTeacher,
    db: DbSession,
) -> dict[str, bool]:
    result = await db.execute(select(Variant).where(Variant.id == variant_id))
    variant = result.scalar_one_or_none()
    if not variant:
        raise HTTPException(404, "Вариант не найден")

    items_result = await db.execute(
        select(VariantItem).where(VariantItem.variant_id == variant_id)
    )
    for item in items_result.scalars().all():
        await db.delete(item)

    await db.delete(variant)
    await db.commit()
    return {"ok": True}


async def _variant_to_response(
    variant: Variant, db: AsyncSession
) -> VariantResponse:
    tasks: list[TaskResponse] = []
    for item in variant.items:
        result = await db.execute(select(Task).where(Task.id == item.task_id))
        task = result.scalar_one_or_none()
        if task:
            tasks.append(TaskResponse.model_validate(task))
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
