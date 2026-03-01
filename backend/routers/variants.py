from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_current_user, require_role
from backend.database import get_db
from backend.models import Task, User, Variant, VariantItem
from backend.schemas import TaskResponse, VariantCreate, VariantResponse

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
    result = await db.execute(select(Variant))
    variants = result.scalars().all()
    return [await _variant_to_response(v, db) for v in variants]


@router.get("/{variant_id}", response_model=VariantResponse)
async def get_variant(variant_id: int, db: DbSession) -> VariantResponse:
    result = await db.execute(select(Variant).where(Variant.id == variant_id))
    variant = result.scalar_one_or_none()
    if not variant:
        raise HTTPException(404, "Вариант не найден")
    return await _variant_to_response(variant, db)


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
        created_at=variant.created_at,
        tasks=tasks,
    )
