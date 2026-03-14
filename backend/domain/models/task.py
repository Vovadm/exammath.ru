from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base

if TYPE_CHECKING:
    from backend.domain.models.solution import Solution


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    fipi_id: Mapped[str | None] = mapped_column(
        String(20), unique=True, index=True
    )
    guid: Mapped[str | None] = mapped_column(String(64))
    task_type: Mapped[int] = mapped_column(Integer, default=0, index=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    hint: Mapped[str | None] = mapped_column(String(200))
    answer: Mapped[str | None] = mapped_column(String(100))
    images: Mapped[list[Any]] = mapped_column(JSON, default=list)
    inline_images: Mapped[list[Any]] = mapped_column(JSON, default=list)
    tables: Mapped[list[Any]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    solutions: Mapped[list[Solution]] = relationship(
        "Solution", back_populates="task", lazy="selectin"
    )
