"""add class_id is_public to variants

Revision ID: 668d68d84f44
Revises: 
Create Date: 2026-03-08 21:50:26.076068

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "668d68d84f44"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "variants", sa.Column("class_id", sa.Integer(), nullable=True)
    )
    op.add_column(
        "variants",
        sa.Column(
            "is_public",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.create_foreign_key(
        "fk_variants_class_id",
        "variants",
        "school_classes",
        ["class_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_variants_class_id", "variants", type_="foreignkey")
    op.drop_column("variants", "is_public")
    op.drop_column("variants", "class_id")
