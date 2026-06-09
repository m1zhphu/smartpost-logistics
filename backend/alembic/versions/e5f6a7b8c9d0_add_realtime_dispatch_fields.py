"""add realtime dispatch fields

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-06-10
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("is_online", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("users", sa.Column("online_status_updated_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("last_seen_at", sa.DateTime(), nullable=True))

    op.add_column("booking_requests", sa.Column("dispatched_by_user_id", sa.Integer(), nullable=True))
    op.add_column("booking_requests", sa.Column("dispatched_at", sa.DateTime(), nullable=True))
    op.add_column("booking_requests", sa.Column("dispatch_note", sa.Text(), nullable=True))
    op.add_column("booking_requests", sa.Column("rejected_by_user_id", sa.Integer(), nullable=True))
    op.add_column("booking_requests", sa.Column("rejected_at", sa.DateTime(), nullable=True))
    op.add_column("booking_requests", sa.Column("rejection_note", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("booking_requests", "rejection_note")
    op.drop_column("booking_requests", "rejected_at")
    op.drop_column("booking_requests", "rejected_by_user_id")
    op.drop_column("booking_requests", "dispatch_note")
    op.drop_column("booking_requests", "dispatched_at")
    op.drop_column("booking_requests", "dispatched_by_user_id")

    op.drop_column("users", "last_seen_at")
    op.drop_column("users", "online_status_updated_at")
    op.drop_column("users", "is_online")
