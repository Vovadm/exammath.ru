"""add class_id to variants

Revision ID: 4a0e56020599
Revises: 668d68d84f44
Create Date: 2026-03-08 22:37:26.007390

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision: str = "4a0e56020599"
down_revision: Union[str, Sequence[str], None] = "668d68d84f44"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint(op.f("variants_ibfk_2"), "variants", type_="foreignkey")
    op.create_foreign_key(
        "variants_ibfk_class",
        "variants",
        "school_classes",
        ["class_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.drop_column("variants", "is_public")


def downgrade() -> None:
    op.add_column(
        "variants",
        sa.Column(
            "is_public",
            mysql.TINYINT(display_width=1),
            autoincrement=False,
            nullable=False,
        ),
    )
    op.drop_constraint("variants_ibfk_class", "variants", type_="foreignkey")
    op.create_foreign_key(
        op.f("variants_ibfk_2"),
        "variants",
        "school_classes",
        ["class_id"],
        ["id"],
    )
