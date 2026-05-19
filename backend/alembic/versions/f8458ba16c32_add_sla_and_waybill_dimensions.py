"""Add SLA and waybill dimensions fields

Revision ID: f8458ba16c32
Revises: f8458ba16c31
Create Date: 2026-05-18 14:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f8458ba16c32'
down_revision: Union[str, Sequence[str], None] = '5fe7766fb92b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Lấy thông tin kết nối và kiểm tra cấu trúc DB thực tế
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('waybills')]
    
    # 1. Chỉ thêm các cột nếu chúng chưa tồn tại trong DB thực tế
    if 'holding_hub_id' not in columns:
        op.add_column('waybills', sa.Column('holding_hub_id', sa.Integer(), nullable=True))
    if 'holding_shipper_id' not in columns:
        op.add_column('waybills', sa.Column('holding_shipper_id', sa.Integer(), nullable=True))
    if 'sla_deadline' not in columns:
        op.add_column('waybills', sa.Column('sla_deadline', sa.DateTime(), nullable=True))
    
    if 'sender_name' not in columns:
        op.add_column('waybills', sa.Column('sender_name', sa.String(length=100), nullable=True))
    if 'sender_phone' not in columns:
        op.add_column('waybills', sa.Column('sender_phone', sa.String(length=20), nullable=True))
    if 'sender_address' not in columns:
        op.add_column('waybills', sa.Column('sender_address', sa.String(length=255), nullable=True))
    
    if 'length' not in columns:
        op.add_column('waybills', sa.Column('length', sa.Numeric(precision=10, scale=2), nullable=True))
    if 'width' not in columns:
        op.add_column('waybills', sa.Column('width', sa.Numeric(precision=10, scale=2), nullable=True))
    if 'height' not in columns:
        op.add_column('waybills', sa.Column('height', sa.Numeric(precision=10, scale=2), nullable=True))
    
    # 2. Tạo các ràng buộc khoá ngoại (chỉ khi chưa tồn tại)
    fk_names = [fk['name'] for fk in inspector.get_foreign_keys('waybills')]
    if 'waybills_holding_hub_id_fkey' not in fk_names:
        op.create_foreign_key('waybills_holding_hub_id_fkey', 'waybills', 'hubs', ['holding_hub_id'], ['hub_id'])
    if 'waybills_holding_shipper_id_fkey' not in fk_names:
        op.create_foreign_key('waybills_holding_shipper_id_fkey', 'waybills', 'users', ['holding_shipper_id'], ['user_id'])


def downgrade() -> None:
    """Downgrade schema."""
    # 1. Xoá các ràng buộc khoá ngoại
    op.drop_constraint('waybills_holding_shipper_id_fkey', 'waybills', type_='foreignkey')
    op.drop_constraint('waybills_holding_hub_id_fkey', 'waybills', type_='foreignkey')
    
    # 2. Xoá các cột đã thêm
    op.drop_column('waybills', 'height')
    op.drop_column('waybills', 'width')
    op.drop_column('waybills', 'length')
    
    op.drop_column('waybills', 'sender_address')
    op.drop_column('waybills', 'sender_phone')
    op.drop_column('waybills', 'sender_name')
    
    op.drop_column('waybills', 'sla_deadline')
    op.drop_column('waybills', 'holding_shipper_id')
    op.drop_column('waybills', 'holding_hub_id')
