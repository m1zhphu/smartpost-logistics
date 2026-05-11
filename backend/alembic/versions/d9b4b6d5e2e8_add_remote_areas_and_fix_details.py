"""add_remote_areas_and_fix_details

Revision ID: d9b4b6d5e2e8
Revises: 3157d0cd1c94
Create Date: 2026-05-11 15:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd9b4b6d5e2e8'
down_revision: Union[str, Sequence[str], None] = '3157d0cd1c94'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Lấy thông tin kết nối hiện tại để kiểm tra sự tồn tại của bảng
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # 1. Chỉ tạo bảng remote_areas nếu chưa tồn tại
    if 'remote_areas' not in tables:
        op.create_table('remote_areas',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('province_id', sa.Integer(), nullable=False),
            sa.Column('district_id', sa.Integer(), nullable=False),
            sa.Column('ward_id', sa.Integer(), nullable=False),
            sa.Column('fee', sa.Numeric(precision=15, scale=2), server_default=sa.text('0'), nullable=False),
            sa.PrimaryKeyConstraint('id', name='remote_areas_pkey'),
            sa.UniqueConstraint('province_id', 'district_id', 'ward_id', name='unique_remote_area')
        )

    # 2. Bổ sung cột cho statement_details (kiểm tra cột trước khi add)
    columns = [c['name'] for c in inspector.get_columns('statement_details')]
    
    if 'type' not in columns:
        op.add_column('statement_details', sa.Column('type', sa.String(length=20), nullable=True))
    
    if 'statement_type' not in columns:
        op.add_column('statement_details', sa.Column('statement_type', sa.String(length=20), nullable=True))

def downgrade() -> None:
    # Downgrade an toàn
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'remote_areas' in tables:
        op.drop_table('remote_areas')

    columns = [c['name'] for c in inspector.get_columns('statement_details')]
    if 'statement_type' in columns:
        op.drop_column('statement_details', 'statement_type')
    if 'type' in columns:
        op.drop_column('statement_details', 'type')
