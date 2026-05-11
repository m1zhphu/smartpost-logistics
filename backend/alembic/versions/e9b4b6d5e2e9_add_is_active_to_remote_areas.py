"""add_is_active_to_remote_areas

Revision ID: e9b4b6d5e2e9
Revises: d9b4b6d5e2e8
Create Date: 2026-05-11 16:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e9b4b6d5e2e9'
down_revision: Union[str, Sequence[str], None] = 'd9b4b6d5e2e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Kiểm tra xem cột is_active đã tồn tại chưa trước khi add
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('remote_areas')]
    
    if 'is_active' not in columns:
        op.add_column('remote_areas', sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False))

def downgrade() -> None:
    op.drop_column('remote_areas', 'is_active')
