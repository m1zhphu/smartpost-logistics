"""add online pickup flow fields

Revision ID: a1b2c3d4e5f6
Revises: f6a8b0c2d4e6
Create Date: 2026-06-07
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "f6a8b0c2d4e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


BOOKING_COLUMNS = [
    ("confirmed_by_user_id", sa.Column("confirmed_by_user_id", sa.Integer(), nullable=True)),
    ("confirmed_at", sa.Column("confirmed_at", sa.DateTime(), nullable=True)),
    ("pickup_assigned_by_user_id", sa.Column("pickup_assigned_by_user_id", sa.Integer(), nullable=True)),
    ("pickup_assigned_at", sa.Column("pickup_assigned_at", sa.DateTime(), nullable=True)),
]

WAYBILL_COLUMNS = [
    ("estimated_weight", sa.Column("estimated_weight", sa.Numeric(10, 2), nullable=True)),
    ("estimated_converted_weight", sa.Column("estimated_converted_weight", sa.Numeric(10, 2), nullable=True)),
    ("estimated_shipping_fee", sa.Column("estimated_shipping_fee", sa.Numeric(15, 2), server_default=sa.text("0"), nullable=True)),
    ("estimated_extra_services_fee", sa.Column("estimated_extra_services_fee", sa.Numeric(15, 2), server_default=sa.text("0"), nullable=True)),
    ("estimated_vat_amount", sa.Column("estimated_vat_amount", sa.Numeric(15, 2), server_default=sa.text("0"), nullable=True)),
    ("estimated_total_amount", sa.Column("estimated_total_amount", sa.Numeric(15, 2), server_default=sa.text("0"), nullable=True)),
    ("final_weight", sa.Column("final_weight", sa.Numeric(10, 2), nullable=True)),
    ("final_converted_weight", sa.Column("final_converted_weight", sa.Numeric(10, 2), nullable=True)),
    ("final_shipping_fee", sa.Column("final_shipping_fee", sa.Numeric(15, 2), server_default=sa.text("0"), nullable=True)),
    ("final_extra_services_fee", sa.Column("final_extra_services_fee", sa.Numeric(15, 2), server_default=sa.text("0"), nullable=True)),
    ("final_vat_amount", sa.Column("final_vat_amount", sa.Numeric(15, 2), server_default=sa.text("0"), nullable=True)),
    ("final_total_amount", sa.Column("final_total_amount", sa.Numeric(15, 2), server_default=sa.text("0"), nullable=True)),
    ("price_status", sa.Column("price_status", sa.String(length=30), server_default=sa.text("'ESTIMATED'"), nullable=True)),
]


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    booking_columns = {column["name"] for column in inspector.get_columns("booking_requests")}
    for name, column in BOOKING_COLUMNS:
        if name not in booking_columns:
            op.add_column("booking_requests", column)

    waybill_columns = {column["name"] for column in inspector.get_columns("waybills")}
    for name, column in WAYBILL_COLUMNS:
        if name not in waybill_columns:
            op.add_column("waybills", column)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    waybill_columns = {column["name"] for column in inspector.get_columns("waybills")}
    for name, _ in reversed(WAYBILL_COLUMNS):
        if name in waybill_columns:
            op.drop_column("waybills", name)

    booking_columns = {column["name"] for column in inspector.get_columns("booking_requests")}
    for name, _ in reversed(BOOKING_COLUMNS):
        if name in booking_columns:
            op.drop_column("booking_requests", name)
