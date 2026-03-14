from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from backend.core.deps import DbSession, TeacherOrAdmin
from backend.domain.models.class_ import ClassMember
from backend.repositories.class_repo import ClassRepository
from backend.repositories.solution_repo import SolutionRepository
from backend.repositories.task_repo import TaskRepository
from backend.repositories.user_repo import UserRepository
from backend.repositories.variant_repo import VariantRepository
from backend.schemas.auth import UserResponse
from backend.schemas.class_ import ClassResponse
from backend.schemas.variant import VariantCreate, VariantResponse
from backend.services.class_service import ClassService
from backend.services.variant_service import VariantService

router = APIRouter(prefix="/api/teacher", tags=["teacher"])


def get_variant_service(db: DbSession) -> VariantService:
    return VariantService(
        variant_repo=VariantRepository(db),
        task_repo=TaskRepository(db),
        solution_repo=SolutionRepository(db),
    )


def get_class_service(db: DbSession) -> ClassService:
    return ClassService(
        class_repo=ClassRepository(db), user_repo=UserRepository(db)
    )


@router.get("/classes", response_model=list[ClassResponse])
async def get_my_classes(
    current_user: TeacherOrAdmin, db: DbSession
) -> list[ClassResponse]:
    return await get_class_service(db).get_list(
        current_user.id, current_user.role
    )


@router.get("/classes/{class_id}/students", response_model=list[UserResponse])
async def get_class_students(
    class_id: int, current_user: TeacherOrAdmin, db: DbSession
) -> list[UserResponse]:
    class_repo = ClassRepository(db)
    sc = await class_repo.get_by_id(class_id)
    if not sc:
        raise HTTPException(404, "Класс не найден")

    if current_user.role == "teacher":
        member = await class_repo.get_member(class_id, current_user.id)
        if not member or member.role != "teacher":
            raise HTTPException(403, "Нет доступа к этому классу")

    students = await class_repo.get_students_in_class(class_id)
    return [UserResponse.model_validate(u) for u in students]


@router.post("/variants", response_model=VariantResponse)
async def create_variant(
    data: VariantCreate, current_user: TeacherOrAdmin, db: DbSession
) -> VariantResponse:
    return await get_variant_service(db).create(data, current_user.id)


@router.get("/variants", response_model=list[VariantResponse])
async def get_my_variants(
    current_user: TeacherOrAdmin, db: DbSession
) -> list[VariantResponse]:
    return await get_variant_service(db).get_for_teacher(
        current_user.id, current_user.role
    )


@router.get("/students", response_model=list[dict])
async def get_students(
    current_user: TeacherOrAdmin, db: DbSession
) -> list[dict]:
    user_repo = UserRepository(db)
    class_repo = ClassRepository(db)

    if current_user.role == "admin":
        students = await user_repo.get_by_role("student")
    else:
        classes = await class_repo.get_for_teacher(current_user.id)
        class_ids = [c.id for c in classes]
        result = await db.execute(
            select(ClassMember.user_id).where(
                ClassMember.class_id.in_(class_ids),
                ClassMember.role == "student",
            )
        )
        student_ids = [row[0] for row in result.all()]
        students = await user_repo.get_many_by_ids(student_ids)

    return [
        {"id": s.id, "username": s.username, "email": s.email}
        for s in students
    ]
