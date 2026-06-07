"""add pickup form options

Revision ID: f6a8b0c2d4e6
Revises: e4f6a8b0c2d4
Create Date: 2026-06-07
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f6a8b0c2d4e6"
down_revision: Union[str, None] = "e4f6a8b0c2d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


BOOKING_COLUMNS = [
    ("requested_pickup_time", sa.Column("requested_pickup_time", sa.DateTime(), nullable=True)),
    ("pickup_method", sa.Column("pickup_method", sa.String(length=50), nullable=True)),
]

WAYBILL_COLUMNS = [
    ("cod_fee_payment_method", sa.Column("cod_fee_payment_method", sa.String(length=50), nullable=True)),
    ("pickup_method", sa.Column("pickup_method", sa.String(length=50), nullable=True)),
    ("delivery_method", sa.Column("delivery_method", sa.String(length=50), nullable=True)),
    ("requested_pickup_time", sa.Column("requested_pickup_time", sa.DateTime(), nullable=True)),
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
