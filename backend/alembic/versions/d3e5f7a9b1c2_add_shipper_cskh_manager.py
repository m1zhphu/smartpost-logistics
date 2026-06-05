"""add cskh manager to shippers

Revision ID: d3e5f7a9b1c2
Revises: c2d4e6f8a1b3
Create Date: 2026-06-04
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d3e5f7a9b1c2"
down_revision: Union[str, None] = "c2d4e6f8a1b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("users")}
    foreign_keys = {fk["name"] for fk in inspector.get_foreign_keys("users")}

    if "managed_by_cskh_id" not in columns:
        op.add_column("users", sa.Column("managed_by_cskh_id", sa.Integer(), nullable=True))

    if "users_managed_by_cskh_id_fkey" not in foreign_keys:
        op.create_foreign_key(
            "users_managed_by_cskh_id_fkey",
            "users",
            "users",
            ["managed_by_cskh_id"],
            ["user_id"],
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("users")}
    foreign_keys = {fk["name"] for fk in inspector.get_foreign_keys("users")}

    if "users_managed_by_cskh_id_fkey" in foreign_keys:
        op.drop_constraint("users_managed_by_cskh_id_fkey", "users", type_="foreignkey")
    if "managed_by_cskh_id" in columns:
        op.drop_column("users", "managed_by_cskh_id")
