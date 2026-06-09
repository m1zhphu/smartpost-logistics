"""add incremental pricing rule fields

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-09
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("pricing_rules", "from_province_id", existing_type=sa.Integer(), nullable=True)
    op.alter_column("pricing_rules", "to_province_id", existing_type=sa.Integer(), nullable=True)
    op.add_column("pricing_rules", sa.Column("pricing_method", sa.String(length=20), nullable=False, server_default="FIXED"))
    op.add_column("pricing_rules", sa.Column("base_weight", sa.Numeric(10, 2), nullable=True))
    op.add_column("pricing_rules", sa.Column("increment_weight", sa.Numeric(10, 2), nullable=True))
    op.add_column("pricing_rules", sa.Column("increment_price", sa.Numeric(15, 2), nullable=True))
    op.add_column("pricing_rules", sa.Column("fuel_surcharge_percent", sa.Numeric(5, 2), nullable=False, server_default="10"))
    op.add_column("pricing_rules", sa.Column("vat_percent", sa.Numeric(5, 2), nullable=False, server_default="8"))


def downgrade() -> None:
    op.alter_column("pricing_rules", "to_province_id", existing_type=sa.Integer(), nullable=False)
    op.alter_column("pricing_rules", "from_province_id", existing_type=sa.Integer(), nullable=False)
    op.drop_column("pricing_rules", "vat_percent")
    op.drop_column("pricing_rules", "fuel_surcharge_percent")
    op.drop_column("pricing_rules", "increment_price")
    op.drop_column("pricing_rules", "increment_weight")
    op.drop_column("pricing_rules", "base_weight")
    op.drop_column("pricing_rules", "pricing_method")
