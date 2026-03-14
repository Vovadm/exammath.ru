from fastapi import HTTPException

from backend.repositories.solution_repo import SolutionRepository
from backend.repositories.task_repo import TaskRepository
from backend.repositories.variant_repo import VariantRepository
from backend.schemas.solution import SolutionFileResponse
from backend.schemas.task import TaskResponse
from backend.schemas.variant import (
    VariantCreate,
    VariantResponse,
    VariantStudentSolutionResponse,
)


class VariantService:
    def __init__(
        self,
        variant_repo: VariantRepository,
        task_repo: TaskRepository,
        solution_repo: SolutionRepository,
    ) -> None:
        self._variants = variant_repo
        self._tasks = task_repo
        self._solutions = solution_repo

    async def create(
        self, data: VariantCreate, creator_id: int
    ) -> VariantResponse:
        task_map = await self._tasks.get_many_by_ids(data.task_ids)
        missing = [tid for tid in data.task_ids if tid not in task_map]
        if missing:
            raise HTTPException(400, f"Задания не найдены: {missing}")

        variant = await self._variants.create(
            title=data.title,
            description=data.description,
            created_by=creator_id,
            class_id=data.class_id,
            is_public=data.is_public,
            task_ids=data.task_ids,
        )
        return self._to_response(
            variant,
            [task_map[tid] for tid in data.task_ids if tid in task_map],
        )

    async def get_for_user(
        self, user_id: int, role: str, class_ids: list[int]
    ) -> list[VariantResponse]:
        if role in ("admin", "teacher"):
            variants = await self._variants.get_all()
        else:
            if not class_ids:
                return []
            variants = await self._variants.get_by_class_ids(class_ids)

        return await self._hydrate_many(variants)

    async def get_for_teacher(
        self, user_id: int, role: str
    ) -> list[VariantResponse]:
        if role == "admin":
            variants = await self._variants.get_all()
        else:
            variants = await self._variants.get_by_creator(user_id)
        return await self._hydrate_many(variants)

    async def get_one(
        self, variant_id: int, user_id: int, role: str, class_ids: list[int]
    ) -> VariantResponse:
        variant = await self._variants.get_by_id(variant_id)
        if not variant:
            raise HTTPException(404, "Вариант не найден")

        if role not in ("admin", "teacher") and variant.class_id is not None:
            if variant.class_id not in class_ids:
                raise HTTPException(403, "Нет доступа к этому варианту")

        return await self._hydrate_one(variant)

    async def get_student_solutions(
        self, variant_id: int, student_id: int
    ) -> list[VariantStudentSolutionResponse]:
        variant = await self._variants.get_by_id(variant_id)
        if not variant:
            raise HTTPException(404, "Вариант не найден")

        task_ids = [item.task_id for item in variant.items]
        task_map = await self._tasks.get_many_by_ids(task_ids)
        solution_map = await self._solutions.get_latest_for_tasks(
            student_id, task_ids
        )

        responses: list[VariantStudentSolutionResponse] = []
        for item in variant.items:
            task = task_map.get(item.task_id)
            if not task:
                continue
            solution = solution_map.get(item.task_id)
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
                        task_id=item.task_id, task_type=task.task_type
                    )
                )
        return responses

    async def delete(self, variant_id: int) -> None:
        variant = await self._variants.get_by_id(variant_id)
        if not variant:
            raise HTTPException(404, "Вариант не найден")
        await self._variants.delete(variant)

    async def _hydrate_many(self, variants: list) -> list[VariantResponse]:
        all_task_ids = [item.task_id for v in variants for item in v.items]
        task_map = await self._tasks.get_many_by_ids(all_task_ids)
        return [
            self._to_response(
                v,
                [
                    task_map[i.task_id]
                    for i in v.items
                    if i.task_id in task_map
                ],
            )
            for v in variants
        ]

    async def _hydrate_one(self, variant) -> VariantResponse:
        task_ids = [item.task_id for item in variant.items]
        task_map = await self._tasks.get_many_by_ids(task_ids)
        return self._to_response(
            variant, [task_map[tid] for tid in task_ids if tid in task_map]
        )

    def _to_response(self, variant, tasks: list) -> VariantResponse:
        return VariantResponse(
            id=variant.id,
            title=variant.title,
            description=variant.description,
            created_by=variant.created_by,
            class_id=variant.class_id,
            is_public=variant.is_public,
            created_at=variant.created_at,
            tasks=[TaskResponse.model_validate(t) for t in tasks],
        )
