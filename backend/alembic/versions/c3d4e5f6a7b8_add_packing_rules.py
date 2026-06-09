"""add packing rules

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-06-09
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "packing_rules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("packing_type", sa.String(length=20), nullable=False),
        sa.Column("min_weight", sa.Numeric(10, 2), nullable=False),
        sa.Column("max_weight", sa.Numeric(10, 2), nullable=False),
        sa.Column("packing_fee", sa.Numeric(15, 2), nullable=False),
        sa.Column("added_weight", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=True),
        sa.PrimaryKeyConstraint("id", name="packing_rules_pkey"),
        sa.UniqueConstraint("packing_type", "min_weight", "max_weight", name="unique_packing_rule"),
    )


def downgrade() -> None:
    op.drop_table("packing_rules")
