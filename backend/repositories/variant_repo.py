from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.domain.models.variant import Variant, VariantItem


class VariantRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, variant_id: int) -> Variant | None:
        result = await self._db.execute(
            select(Variant)
            .options(
                selectinload(Variant.items).selectinload(VariantItem.task),
                selectinload(Variant.creator),
                selectinload(Variant.school_class),
            )
            .where(Variant.id == variant_id)
        )
        return result.scalar_one_or_none()

    async def get_all(self) -> list[Variant]:
        result = await self._db.execute(
            select(Variant).options(
                selectinload(Variant.items),
                selectinload(Variant.creator),
                selectinload(Variant.school_class),
            )
        )
        return list(result.scalars().all())

    async def get_by_creator(self, user_id: int) -> list[Variant]:
        result = await self._db.execute(
            select(Variant)
            .options(
                selectinload(Variant.items),
                selectinload(Variant.creator),
                selectinload(Variant.school_class),
            )
            .where(Variant.created_by == user_id)
        )
        return list(result.scalars().all())

    async def get_by_class_ids(self, class_ids: list[int]) -> list[Variant]:
        result = await self._db.execute(
            select(Variant)
            .options(
                selectinload(Variant.items),
                selectinload(Variant.creator),
                selectinload(Variant.school_class),
            )
            .where(Variant.class_id.in_(class_ids))
        )
        return list(result.scalars().all())

    async def create(
        self,
        title: str,
        description: str | None,
        created_by: int,
        class_id: int | None,
        is_public: bool,
        task_ids: list[int],
    ) -> Variant:
        variant = Variant(
            title=title,
            description=description,
            created_by=created_by,
            class_id=class_id,
            is_public=is_public,
        )
        self._db.add(variant)
        await self._db.commit()
        await self._db.refresh(variant)

        for i, task_id in enumerate(task_ids):
            self._db.add(
                VariantItem(variant_id=variant.id, task_id=task_id, position=i)
            )

        await self._db.commit()
        await self._db.refresh(variant)
        return variant

    async def delete(self, variant: Variant) -> None:
        items_result = await self._db.execute(
            select(VariantItem).where(VariantItem.variant_id == variant.id)
        )
        for item in items_result.scalars().all():
            await self._db.delete(item)
        await self._db.delete(variant)
        await self._db.commit()
