from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.domain.models.class_ import ClassMember, SchoolClass
from backend.domain.models.user import User


class ClassRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, class_id: int) -> SchoolClass | None:
        result = await self._db.execute(
            select(SchoolClass).where(SchoolClass.id == class_id)
        )
        return result.scalar_one_or_none()

    async def get_all(self) -> list[SchoolClass]:
        result = await self._db.execute(select(SchoolClass))
        return list(result.scalars().all())

    async def get_for_teacher(self, user_id: int) -> list[SchoolClass]:
        result = await self._db.execute(
            select(SchoolClass)
            .join(ClassMember)
            .where(
                ClassMember.user_id == user_id, ClassMember.role == "teacher"
            )
        )
        return list(result.scalars().all())

    async def get_for_user(self, user_id: int) -> list[SchoolClass]:
        result = await self._db.execute(
            select(SchoolClass)
            .join(ClassMember)
            .where(ClassMember.user_id == user_id)
        )
        return list(result.scalars().all())

    async def get_user_class_ids(self, user_id: int) -> list[int]:
        result = await self._db.execute(
            select(ClassMember.class_id).where(ClassMember.user_id == user_id)
        )
        return [row[0] for row in result.all()]

    async def get_member(
        self, class_id: int, user_id: int
    ) -> ClassMember | None:
        result = await self._db.execute(
            select(ClassMember).where(
                ClassMember.class_id == class_id,
                ClassMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_students_in_class(self, class_id: int) -> list[User]:
        result = await self._db.execute(
            select(User)
            .join(ClassMember)
            .where(
                ClassMember.class_id == class_id, ClassMember.role == "student"
            )
        )
        return list(result.scalars().all())

    async def create(
        self, name: str, description: str | None, created_by: int
    ) -> SchoolClass:
        sc = SchoolClass(
            name=name, description=description, created_by=created_by
        )
        self._db.add(sc)
        await self._db.commit()
        await self._db.refresh(sc)
        return sc

    async def add_member(
        self, class_id: int, user_id: int, role: str
    ) -> ClassMember:
        member = ClassMember(class_id=class_id, user_id=user_id, role=role)
        self._db.add(member)
        await self._db.commit()
        await self._db.refresh(member)
        return member

    async def remove_member(self, member: ClassMember) -> None:
        await self._db.delete(member)
        await self._db.commit()

    async def delete(self, sc: SchoolClass) -> None:
        members_result = await self._db.execute(
            select(ClassMember).where(ClassMember.class_id == sc.id)
        )
        for m in members_result.scalars().all():
            await self._db.delete(m)
        await self._db.delete(sc)
        await self._db.commit()
