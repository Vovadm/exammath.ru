from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base

if TYPE_CHECKING:
    from backend.domain.models.user import User


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
