"""add bulk mail draft items

Revision ID: c9d0e1f2a3b4
Revises: b8c9d0e1f2a3
"""

from typing import Union

import sqlalchemy as sa
from alembic import op


revision: str = "c9d0e1f2a3b4"
down_revision: Union[str, None] = "b8c9d0e1f2a3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "bulk_mail_draft_items",
        sa.Column("draft_item_id", sa.Integer(), primary_key=True),
        sa.Column("request_id", sa.Integer(), nullable=False),
        sa.Column("bag_id", sa.Integer(), nullable=True),
        sa.Column("waybill_id", sa.Integer(), nullable=True),
        sa.Column("sequence_no", sa.Integer(), nullable=False),
        sa.Column("customer_reference_code", sa.String(100), nullable=True),
        sa.Column("receiver_name", sa.String(100), nullable=True),
        sa.Column("receiver_phone", sa.String(20), nullable=True),
        sa.Column("receiver_address", sa.String(255), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("status", sa.String(30), server_default="PENDING_OCR", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["request_id"], ["booking_requests.request_id"], name="bulk_mail_draft_items_request_id_fkey", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["bag_id"], ["bags.bag_id"], name="bulk_mail_draft_items_bag_id_fkey", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["waybill_id"], ["waybills.waybill_id"], name="bulk_mail_draft_items_waybill_id_fkey", ondelete="SET NULL"),
        sa.UniqueConstraint("request_id", "sequence_no", name="bulk_mail_draft_items_request_sequence_key"),
    )


def downgrade() -> None:
    op.drop_table("bulk_mail_draft_items")
