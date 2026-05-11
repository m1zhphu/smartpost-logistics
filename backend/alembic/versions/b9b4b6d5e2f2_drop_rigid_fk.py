"""drop_rigid_fk_in_statement_details

Revision ID: b9b4b6d5e2f2
Revises: a9b4b6d5e2f1
Create Date: 2026-05-11 16:23:30.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b9b4b6d5e2f2'
down_revision: Union[str, Sequence[str], None] = 'a9b4b6d5e2f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Gỡ bỏ ràng buộc khóa ngoại trỏ cứng vào statement_cod
    # Tên constraint có thể khác nhau tùy môi trường, nhưng dựa trên lỗi là statement_details_statement_id_fkey
    try:
        op.drop_constraint('statement_details_statement_id_fkey', 'statement_details', type_='foreignkey')
    except Exception as e:
        print(f"Warning: Could not drop constraint: {e}")

def downgrade() -> None:
    # Khôi phục (nếu cần)
    op.create_foreign_key('statement_details_statement_id_fkey', 'statement_details', 'statement_cod', ['statement_id'], ['statement_id'])
