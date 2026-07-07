"""add_internal_and_old_province_to_waybills

Revision ID: accf93260ee7
Revises: 9bde810550e3
Create Date: 2026-07-08 00:07:52.557911

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'accf93260ee7'
down_revision: Union[str, Sequence[str], None] = '9bde810550e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add is_internal and old_province fields to waybills table."""
    op.add_column('waybills', sa.Column('is_internal', sa.Boolean(), server_default=sa.text('false'), nullable=True))
    op.add_column('waybills', sa.Column('old_province', sa.String(length=150), nullable=True))


def downgrade() -> None:
    """Remove is_internal and old_province fields from waybills table."""
    op.drop_column('waybills', 'old_province')
    op.drop_column('waybills', 'is_internal')
