"""add multi image proof fields

Revision ID: d0e1f2a3b4c5
Revises: c9d0e1f2a3b4
Create Date: 2026-06-15 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d0e1f2a3b4c5"
down_revision: Union[str, Sequence[str], None] = "c9d0e1f2a3b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("waybills", sa.Column("pickup_image_urls", sa.Text(), nullable=True))
    op.add_column("delivery_results", sa.Column("pod_image_urls", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("delivery_results", "pod_image_urls")
    op.drop_column("waybills", "pickup_image_urls")
