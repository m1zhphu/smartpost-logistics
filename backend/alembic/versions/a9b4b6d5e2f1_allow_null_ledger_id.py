"""allow_null_ledger_id_in_statement_details

Revision ID: a9b4b6d5e2f1
Revises: e9b4b6d5e2e9
Create Date: 2026-05-11 16:22:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a9b4b6d5e2f1'
down_revision: Union[str, Sequence[str], None] = 'e9b4b6d5e2e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Cho phép NULL cho cột ledger_id trong bảng statement_details
    op.alter_column('statement_details', 'ledger_id',
               existing_type=sa.BIGINT(),
               nullable=True)

def downgrade() -> None:
    # Khôi phục NOT NULL (Lưu ý: sẽ lỗi nếu đang có dữ liệu NULL)
    op.alter_column('statement_details', 'ledger_id',
               existing_type=sa.BIGINT(),
               nullable=False)
