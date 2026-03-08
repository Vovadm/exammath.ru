from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_current_user, require_role
from backend.database import get_db
from backend.models import Solution, Task, User, Variant, VariantItem
from backend.schemas import (
    SolutionFileResponse,
    SolutionResponse,
    TaskResponse,
    UserResponse,
    VariantCreate,
    VariantResponse,
    VariantStudentTaskView,
    VariantStudentView,
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
    result = await db.execute(select(Variant))
    variants = result.scalars().all()

    accessible: list[VariantResponse] = []
    for v in variants:
        if _can_access_variant(v, current_user):
            accessible.append(await _variant_to_response(v, db))
    return accessible


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
    if not _can_access_variant(variant, current_user):
        raise HTTPException(403, "Нет доступа к этому варианту")
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


@router.get(
    "/{variant_id}/student-view/{student_id}",
    response_model=VariantStudentView,
)
async def get_variant_student_view(
    variant_id: int,
    student_id: int,
    current_user: AdminOrTeacher,
    db: DbSession,
) -> VariantStudentView:
    variant_result = await db.execute(
        select(Variant).where(Variant.id == variant_id)
    )
    variant = variant_result.scalar_one_or_none()
    if not variant:
        raise HTTPException(404, "Вариант не найден")

    student_result = await db.execute(
        select(User).where(User.id == student_id)
    )
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(404, "Студент не найден")

    task_views: list[VariantStudentTaskView] = []
    for item in variant.items:
        task_result = await db.execute(
            select(Task).where(Task.id == item.task_id)
        )
        task = task_result.scalar_one_or_none()
        if not task:
            continue

        solution_result = await db.execute(
            select(Solution)
            .where(
                Solution.user_id == student_id,
                Solution.task_id == item.task_id,
            )
            .order_by(Solution.created_at.desc())
        )
        solution = solution_result.scalars().first()

        solution_resp: SolutionResponse | None = None
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
            solution_resp = SolutionResponse(
                id=solution.id,
                user_id=solution.user_id,
                task_id=solution.task_id,
                answer=solution.answer,
                is_correct=solution.is_correct,
                content=solution.content or [],
                files=files,
                created_at=solution.created_at,
                updated_at=solution.updated_at,
                username=student.username,
            )

        task_views.append(
            VariantStudentTaskView(
                task=TaskResponse.model_validate(task),
                solution=solution_resp,
            )
        )

    return VariantStudentView(
        variant=await _variant_to_response(variant, db),
        student=UserResponse.model_validate(student),
        task_views=task_views,
    )


def _can_access_variant(variant: Variant, user: User) -> bool:
    if user.role in ("admin", "teacher"):
        return True
    if variant.is_public:
        return True
    if variant.class_id is None:
        return False
    for membership in user.class_memberships:
        if membership.class_id == variant.class_id:
            return True
    return False


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
