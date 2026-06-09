"""allow zone pricing null provinces

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-06-10
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("pricing_rules", "from_province_id", existing_type=sa.Integer(), nullable=True)
    op.alter_column("pricing_rules", "to_province_id", existing_type=sa.Integer(), nullable=True)


def downgrade() -> None:
    op.alter_column("pricing_rules", "to_province_id", existing_type=sa.Integer(), nullable=False)
    op.alter_column("pricing_rules", "from_province_id", existing_type=sa.Integer(), nullable=False)
