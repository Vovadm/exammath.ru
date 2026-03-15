from sqlalchemy import and_, func, not_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.domain.models.task import Task
from backend.schemas.task import TaskListResponse, TaskResponse


class TaskRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, task_id: int) -> Task | None:
        result = await self._db.execute(select(Task).where(Task.id == task_id))
        return result.scalar_one_or_none()

    async def get_many_by_ids(self, task_ids: list[int]) -> dict[int, Task]:
        result = await self._db.execute(
            select(Task).where(Task.id.in_(task_ids))
        )
        return {t.id: t for t in result.scalars().all()}

    async def get_paginated(
        self,
        page: int,
        per_page: int,
        task_type: int | None = None,
        search: str | None = None,
        filter: str | None = None,
    ) -> TaskListResponse:
        q = select(Task)
        count_q = select(func.count(Task.id))

        if task_type is not None:
            q = q.where(Task.task_type == task_type)
            count_q = count_q.where(Task.task_type == task_type)

        if filter == "untyped":
            cond = or_(
                Task.task_type == 0, not_(Task.task_type.between(1, 19))
            )
            q = q.where(cond)
            count_q = count_q.where(cond)
        elif filter == "no_answer":
            cond = and_(
                Task.task_type.between(1, 12),
                or_(Task.answer.is_(None), Task.answer == ""),
            )
            q = q.where(cond)
            count_q = count_q.where(cond)

        if search:
            cond = Task.text.ilike(f"%{search}%")
            q = q.where(cond)
            count_q = count_q.where(cond)

        total = (await self._db.execute(count_q)).scalar_one()
        pages = max(1, (total + per_page - 1) // per_page)

        result = await self._db.execute(
            q.offset((page - 1) * per_page).limit(per_page)
        )
        tasks = [
            TaskResponse.model_validate(t) for t in result.scalars().all()
        ]

        return TaskListResponse(
            tasks=tasks, total=total, page=page, pages=pages
        )

    async def update(self, task: Task, **fields: object) -> Task:
        for key, value in fields.items():
            if value is not None:
                setattr(task, key, value)
        await self._db.commit()
        await self._db.refresh(task)
        return task
