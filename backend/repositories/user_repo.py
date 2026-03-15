from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.domain.models.user import User, UserStats


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, user_id: int) -> User | None:
        result = await self._db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        result = await self._db.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self._db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_all(self) -> list[User]:
        result = await self._db.execute(select(User))
        return list(result.scalars().all())

    async def get_by_role(self, role: str) -> list[User]:
        result = await self._db.execute(select(User).where(User.role == role))
        return list(result.scalars().all())

    async def get_many_by_ids(self, user_ids: list[int]) -> list[User]:
        result = await self._db.execute(
            select(User).where(User.id.in_(user_ids))
        )
        return list(result.scalars().all())

    async def create(
        self, username: str, email: str, hashed_password: str
    ) -> User:
        user = User(
            username=username, email=email, hashed_password=hashed_password
        )
        self._db.add(user)
        await self._db.commit()
        await self._db.refresh(user)
        return user

    async def save(self, user: User) -> User:
        await self._db.commit()
        await self._db.refresh(user)
        return user

    async def delete(self, user: User) -> None:
        await self._db.delete(user)
        await self._db.commit()

    async def get_stats(self, user_id: int) -> UserStats | None:
        result = await self._db.execute(
            select(UserStats).where(UserStats.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_stats(self, user_id: int) -> UserStats:
        stats = UserStats(user_id=user_id)
        self._db.add(stats)
        await self._db.commit()
        return stats

    async def save_stats(self, stats: UserStats) -> None:
        await self._db.commit()
