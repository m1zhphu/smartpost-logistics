"""add customer structured address fields

Revision ID: c2d4e6f8a1b3
Revises: b1c2d3e4f5a6
Create Date: 2026-06-04
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c2d4e6f8a1b3"
down_revision: Union[str, None] = "b1c2d3e4f5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("customers")}

    if "country" not in columns:
        op.add_column("customers", sa.Column("country", sa.String(length=100), nullable=True))
    if "province_name" not in columns:
        op.add_column("customers", sa.Column("province_name", sa.String(length=150), nullable=True))
    if "ward_name" not in columns:
        op.add_column("customers", sa.Column("ward_name", sa.String(length=150), nullable=True))
    if "street_address" not in columns:
        op.add_column("customers", sa.Column("street_address", sa.String(length=255), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("customers")}

    if "street_address" in columns:
        op.drop_column("customers", "street_address")
    if "ward_name" in columns:
        op.drop_column("customers", "ward_name")
    if "province_name" in columns:
        op.drop_column("customers", "province_name")
    if "country" in columns:
        op.drop_column("customers", "country")
