from sqlalchemy import select

from backend.domain.models.solution import Solution
from backend.repositories.user_repo import UserRepository
from backend.schemas.stats import TypeStatItem, UserStatsResponse


class StatsService:
    def __init__(self, user_repo: UserRepository) -> None:
        self._users = user_repo

    async def get_user_stats(self, user_id: int) -> UserStatsResponse:
        stats = await self._users.get_stats(user_id)
        if not stats:
            return UserStatsResponse()

        accuracy = 0.0
        if stats.total_attempts > 0:
            accuracy = round(
                stats.correct_attempts / stats.total_attempts * 100, 1
            )

        return UserStatsResponse(
            total_attempts=stats.total_attempts,
            correct_attempts=stats.correct_attempts,
            tasks_solved=stats.tasks_solved,
            accuracy=accuracy,
            streak_current=stats.streak_current,
            streak_max=stats.streak_max,
            last_activity=stats.last_activity,
            stats_by_type=stats.stats_by_type or {},
        )

    async def get_type_stats(self, user_id: int) -> list[TypeStatItem]:
        stats = await self._users.get_stats(user_id)
        if not stats or not stats.stats_by_type:
            return []

        items: list[TypeStatItem] = []
        for key, val in stats.stats_by_type.items():
            attempts = val.get("attempts", 0)
            correct = val.get("correct", 0)
            success_rate = (
                round(correct / attempts * 100, 1) if attempts > 0 else 0.0
            )
            items.append(
                TypeStatItem(
                    task_type=int(key),
                    attempts=attempts,
                    correct=correct,
                    success_rate=success_rate,
                )
            )
        return sorted(items, key=lambda x: x.task_type)

    async def get_history(self, user_id: int) -> list[dict]:
        result = await self._users._db.execute(
            select(Solution)
            .where(Solution.user_id == user_id)
            .order_by(Solution.created_at.desc())
            .limit(50)
        )
        return [
            {
                "id": s.id,
                "task_id": s.task_id,
                "answer": s.answer,
                "is_correct": s.is_correct,
                "created_at": s.created_at.isoformat(),
            }
            for s in result.scalars().all()
        ]
