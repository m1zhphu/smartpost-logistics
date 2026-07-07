"""add_old_province_to_customers

Revision ID: 9bde810550e3
Revises: d0e1f2a3b4c5
Create Date: 2026-07-07 23:31:11.560883

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '9bde810550e3'
down_revision: Union[str, Sequence[str], None] = 'd0e1f2a3b4c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add old_province column to customers table.
    Stores the pre-2025 province name for vehicle sorting/bagging logic.
    This is separate from address_detail which stores the full delivery address.
    """
    op.add_column('customers', sa.Column('old_province', sa.String(length=150), nullable=True))


def downgrade() -> None:
    """Remove old_province column from customers table."""
    op.drop_column('customers', 'old_province')
