"""extend service configs

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-06-09
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("service_configs", sa.Column("calculation_base", sa.String(length=30), nullable=False, server_default="FIXED"))
    op.add_column("service_configs", sa.Column("min_order_value", sa.Numeric(15, 2), nullable=True))
    op.add_column("service_configs", sa.Column("max_order_value", sa.Numeric(15, 2), nullable=True))
    op.add_column("service_configs", sa.Column("min_fee", sa.Numeric(15, 2), nullable=True))


def downgrade() -> None:
    op.drop_column("service_configs", "min_fee")
    op.drop_column("service_configs", "max_order_value")
    op.drop_column("service_configs", "min_order_value")
    op.drop_column("service_configs", "calculation_base")
