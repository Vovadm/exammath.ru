from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base

if TYPE_CHECKING:
    from backend.domain.models.class_ import SchoolClass
    from backend.domain.models.task import Task
    from backend.domain.models.user import User


class Variant(Base):
    __tablename__ = "variants"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    class_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("school_classes.id"), nullable=True
    )
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    items: Mapped[list[VariantItem]] = relationship(
        "VariantItem",
        back_populates="variant",
        order_by="VariantItem.position",
        lazy="selectin",
    )
    creator: Mapped[User] = relationship("User", lazy="selectin")
    school_class: Mapped[SchoolClass | None] = relationship(
        "SchoolClass", lazy="selectin"
    )


class VariantItem(Base):
    __tablename__ = "variant_items"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    variant_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("variants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tasks.id"), nullable=False, index=True
    )
    position: Mapped[int] = mapped_column(Integer, default=0)

    variant: Mapped[Variant] = relationship(
        "Variant", back_populates="items", lazy="selectin"
    )
    task: Mapped[Task] = relationship("Task", lazy="selectin")
