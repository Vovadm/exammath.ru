from fastapi import APIRouter

from backend.core.deps import CurrentUser, DbSession, TeacherOrAdmin
from backend.repositories.class_repo import ClassRepository
from backend.repositories.solution_repo import SolutionRepository
from backend.repositories.task_repo import TaskRepository
from backend.repositories.variant_repo import VariantRepository
from backend.schemas.variant import (
    VariantCreate,
    VariantResponse,
    VariantStudentSolutionResponse,
)
from backend.services.variant_service import VariantService

router = APIRouter(prefix="/api/variants", tags=["variants"])


def get_service(db: DbSession) -> VariantService:
    return VariantService(
        variant_repo=VariantRepository(db),
        task_repo=TaskRepository(db),
        solution_repo=SolutionRepository(db),
    )


@router.post("", response_model=VariantResponse)
async def create_variant(
    data: VariantCreate,
    current_user: TeacherOrAdmin,
    db: DbSession,
) -> VariantResponse:
    return await get_service(db).create(data, current_user.id)


@router.get("", response_model=list[VariantResponse])
async def get_variants(
    current_user: CurrentUser, db: DbSession
) -> list[VariantResponse]:
    class_ids = await ClassRepository(db).get_user_class_ids(current_user.id)
    return await get_service(db).get_for_user(
        current_user.id, current_user.role, class_ids
    )


@router.get("/{variant_id}", response_model=VariantResponse)
async def get_variant(
    variant_id: int, current_user: CurrentUser, db: DbSession
) -> VariantResponse:
    class_ids = await ClassRepository(db).get_user_class_ids(current_user.id)
    return await get_service(db).get_one(
        variant_id, current_user.id, current_user.role, class_ids
    )


@router.get(
    "/{variant_id}/student/{student_id}/solutions",
    response_model=list[VariantStudentSolutionResponse],
)
async def get_variant_student_solutions(
    variant_id: int,
    student_id: int,
    current_user: TeacherOrAdmin,
    db: DbSession,
) -> list[VariantStudentSolutionResponse]:
    return await get_service(db).get_student_solutions(variant_id, student_id)


@router.delete("/{variant_id}")
async def delete_variant(
    variant_id: int, current_user: TeacherOrAdmin, db: DbSession
) -> dict[str, bool]:
    await get_service(db).delete(variant_id)
    return {"ok": True}
