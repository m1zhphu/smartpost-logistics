"""add customer registration otp

Revision ID: b1c2d3e4f5a6
Revises: a8bde70b092d
Create Date: 2026-06-03
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, None] = "a8bde70b092d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    user_columns = {column["name"] for column in inspector.get_columns("users")}
    if "customer_id" not in user_columns:
        op.add_column("users", sa.Column("customer_id", sa.Integer(), nullable=True))

    user_fks = {fk["name"] for fk in inspector.get_foreign_keys("users")}
    if "users_customer_id_fkey" not in user_fks:
        op.create_foreign_key(
            "users_customer_id_fkey",
            "users",
            "customers",
            ["customer_id"],
            ["customer_id"],
        )

    if not inspector.has_table("auth_otp_codes"):
        op.create_table(
            "auth_otp_codes",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("email", sa.String(length=150), nullable=False),
            sa.Column("purpose", sa.String(length=50), nullable=False),
            sa.Column("otp_hash", sa.String(length=255), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("attempts", sa.Integer(), server_default=sa.text("0"), nullable=False),
            sa.Column("consumed_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id", name="auth_otp_codes_pkey"),
        )

    otp_indexes = {index["name"] for index in inspector.get_indexes("auth_otp_codes")}
    if "ix_auth_otp_codes_email" not in otp_indexes:
        op.create_index("ix_auth_otp_codes_email", "auth_otp_codes", ["email"], unique=False)
    if "ix_auth_otp_codes_purpose" not in otp_indexes:
        op.create_index("ix_auth_otp_codes_purpose", "auth_otp_codes", ["purpose"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_auth_otp_codes_purpose"), table_name="auth_otp_codes")
    op.drop_index(op.f("ix_auth_otp_codes_email"), table_name="auth_otp_codes")
    op.drop_table("auth_otp_codes")
    op.drop_constraint("users_customer_id_fkey", "users", type_="foreignkey")
    op.drop_column("users", "customer_id")
