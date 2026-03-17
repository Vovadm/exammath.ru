from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base

if TYPE_CHECKING:
    from backend.domain.models.task import Task
    from backend.domain.models.user import User


class Solution(Base):
    __tablename__ = "solutions"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tasks.id"), nullable=False, index=True
    )
    answer: Mapped[str | None] = mapped_column(String(255))
    is_correct: Mapped[bool | None] = mapped_column(Boolean)
    content: Mapped[list[Any]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user: Mapped[User] = relationship(
        "User", back_populates="solutions", lazy="selectin"
    )
    task: Mapped[Task] = relationship(
        "Task", back_populates="solutions", lazy="selectin"
    )
    files: Mapped[list[SolutionFile]] = relationship(
        "SolutionFile", back_populates="solution", lazy="selectin"
    )


class SolutionFile(Base):
    __tablename__ = "solution_files"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    solution_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("solutions.id"), nullable=False, index=True
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    filepath: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    solution: Mapped[Solution] = relationship(
        "Solution", back_populates="files", lazy="selectin"
    )