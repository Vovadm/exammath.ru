from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.domain.models.solution import Solution, SolutionFile


class SolutionRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, solution_id: int) -> Solution | None:
        result = await self._db.execute(
            select(Solution).where(Solution.id == solution_id)
        )
        return result.scalar_one_or_none()

    async def get_latest_for_user_task(
        self, user_id: int, task_id: int, is_correct: bool | None = None
    ) -> Solution | None:
        q = select(Solution).where(
            Solution.user_id == user_id,
            Solution.task_id == task_id,
        )
        if is_correct is None:
            q = q.where(Solution.is_correct.is_(None))
        else:
            q = q.where(Solution.is_correct.is_(is_correct))

        q = q.order_by(Solution.created_at.desc()).limit(1)

        result = await self._db.execute(q)
        return result.scalar_one_or_none()

    async def get_user_task_solutions(
        self, user_id: int, task_id: int
    ) -> list[Solution]:
        result = await self._db.execute(
            select(Solution)
            .where(Solution.user_id == user_id, Solution.task_id == task_id)
            .order_by(Solution.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_all_for_task(self, task_id: int) -> list[Solution]:
        result = await self._db.execute(
            select(Solution)
            .where(Solution.task_id == task_id)
            .order_by(Solution.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_latest_for_tasks(
        self, user_id: int, task_ids: list[int]
    ) -> dict[int, Solution]:
        result = await self._db.execute(
            select(Solution)
            .options(selectinload(Solution.files))
            .where(Solution.user_id == user_id, Solution.task_id.in_(task_ids))
            .order_by(Solution.created_at.desc())
        )

        solutions: dict[int, Solution] = {}
        for s in result.scalars().all():
            if s.task_id not in solutions:
                solutions[s.task_id] = s
            else:
                existing = solutions[s.task_id]
                if existing.answer is None and s.answer is not None:
                    existing.answer = s.answer
                if existing.is_correct is None and s.is_correct is not None:
                    existing.is_correct = s.is_correct
                if not existing.content and s.content:
                    existing.content = s.content
                if not existing.files and s.files:
                    existing.files = s.files

        return solutions

    async def create(self, **kwargs: object) -> Solution:
        solution = Solution(**kwargs)
        self._db.add(solution)
        await self._db.commit()
        await self._db.refresh(solution)
        return solution

    async def save(self, solution: Solution) -> Solution:
        await self._db.commit()
        await self._db.refresh(solution)
        return solution

    async def add_file(
        self,
        solution_id: int,
        filename: str,
        filepath: str,
        file_type: str | None,
    ) -> SolutionFile:
        sf = SolutionFile(
            solution_id=solution_id,
            filename=filename,
            filepath=filepath,
            file_type=file_type,
        )
        self._db.add(sf)
        await self._db.commit()
        return sf
