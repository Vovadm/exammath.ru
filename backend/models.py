from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    username: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="student")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    solutions: Mapped[list[Solution]] = relationship(
        "Solution", back_populates="user", lazy="selectin"
    )
    stats: Mapped[UserStats | None] = relationship(
        "UserStats", back_populates="user", uselist=False, lazy="selectin"
    )
    class_memberships: Mapped[list[ClassMember]] = relationship(
        "ClassMember", back_populates="user", lazy="selectin"
    )


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


class Solution(Base):
    __tablename__ = "solutions"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tasks.id"), nullable=False
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
        Integer, ForeignKey("solutions.id"), nullable=False
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


class VariantItem(Base):
    __tablename__ = "variant_items"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    variant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("variants.id", ondelete="CASCADE"), nullable=False
    )
    task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tasks.id"), nullable=False
    )
    position: Mapped[int] = mapped_column(Integer, default=0)

    variant: Mapped[Variant] = relationship(
        "Variant", back_populates="items", lazy="selectin"
    )
    task: Mapped[Task] = relationship("Task", lazy="selectin")


class UserStats(Base):
    __tablename__ = "user_stats"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), unique=True, nullable=False
    )
    total_attempts: Mapped[int] = mapped_column(Integer, default=0)
    correct_attempts: Mapped[int] = mapped_column(Integer, default=0)
    tasks_solved: Mapped[int] = mapped_column(Integer, default=0)
    streak_current: Mapped[int] = mapped_column(Integer, default=0)
    streak_max: Mapped[int] = mapped_column(Integer, default=0)
    last_activity: Mapped[datetime | None] = mapped_column(DateTime)
    stats_by_type: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    user: Mapped[User] = relationship(
        "User", back_populates="stats", lazy="selectin"
    )


class SchoolClass(Base):
    __tablename__ = "school_classes"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    members: Mapped[list[ClassMember]] = relationship(
        "ClassMember", back_populates="school_class", lazy="selectin"
    )
    creator: Mapped[User] = relationship("User", lazy="selectin")


class ClassMember(Base):
    __tablename__ = "class_members"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    class_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("school_classes.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(20), default="student")

    school_class: Mapped[SchoolClass] = relationship(
        "SchoolClass", back_populates="members", lazy="selectin"
    )
    user: Mapped[User] = relationship(
        "User", back_populates="class_memberships", lazy="selectin"
    )
