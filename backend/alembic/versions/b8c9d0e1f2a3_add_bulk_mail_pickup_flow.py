"""add bulk mail pickup flow

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
"""

from typing import Union

import sqlalchemy as sa
from alembic import op


revision: str = "b8c9d0e1f2a3"
down_revision: Union[str, None] = "a7b8c9d0e1f2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("booking_requests", sa.Column("pickup_mode", sa.String(30), server_default="SINGLE_WAYBILL", nullable=False))
    op.add_column("booking_requests", sa.Column("actual_quantity", sa.Integer(), server_default="0", nullable=False))
    op.add_column("booking_requests", sa.Column("materialization_status", sa.String(30), server_default="NOT_REQUIRED", nullable=False))

    op.add_column("bags", sa.Column("booking_request_id", sa.Integer(), nullable=True))
    op.add_column("bags", sa.Column("product_type", sa.String(50), nullable=True))
    op.add_column("bags", sa.Column("actual_quantity", sa.Integer(), server_default="0", nullable=False))
    op.add_column("bags", sa.Column("materialization_status", sa.String(30), server_default="PENDING", nullable=False))
    op.add_column("bags", sa.Column("received_at", sa.DateTime(), nullable=True))
    op.add_column("bags", sa.Column("opened_at", sa.DateTime(), nullable=True))
    op.add_column("bags", sa.Column("completed_at", sa.DateTime(), nullable=True))
    op.create_foreign_key("bags_booking_request_id_fkey", "bags", "booking_requests", ["booking_request_id"], ["request_id"], ondelete="SET NULL")
    op.create_unique_constraint("bags_booking_request_id_key", "bags", ["booking_request_id"])
    op.create_check_constraint("ck_booking_requests_pickup_mode", "booking_requests", "pickup_mode IN ('SINGLE_WAYBILL', 'BULK_MAIL')")
    op.create_check_constraint("ck_bulk_mail_product_type", "booking_requests", "pickup_mode <> 'BULK_MAIL' OR product_type IN ('DOCUMENT', 'PARCEL')")


def downgrade() -> None:
    op.drop_constraint("ck_bulk_mail_product_type", "booking_requests", type_="check")
    op.drop_constraint("ck_booking_requests_pickup_mode", "booking_requests", type_="check")
    op.drop_constraint("bags_booking_request_id_key", "bags", type_="unique")
    op.drop_constraint("bags_booking_request_id_fkey", "bags", type_="foreignkey")
    for column in ["completed_at", "opened_at", "received_at", "materialization_status", "actual_quantity", "product_type", "booking_request_id"]:
        op.drop_column("bags", column)
    for column in ["materialization_status", "actual_quantity", "pickup_mode"]:
        op.drop_column("booking_requests", column)
