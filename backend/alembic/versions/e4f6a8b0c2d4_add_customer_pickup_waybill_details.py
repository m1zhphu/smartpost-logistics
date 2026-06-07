"""add customer pickup waybill details

Revision ID: e4f6a8b0c2d4
Revises: d3e5f7a9b1c2
Create Date: 2026-06-07
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e4f6a8b0c2d4"
down_revision: Union[str, None] = "d3e5f7a9b1c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


WAYBILL_COLUMNS = [
    ("sender_province_id", sa.Column("sender_province_id", sa.Integer(), nullable=True)),
    ("sender_district_id", sa.Column("sender_district_id", sa.Integer(), nullable=True)),
    ("sender_ward_id", sa.Column("sender_ward_id", sa.Integer(), nullable=True)),
    ("sender_province_name", sa.Column("sender_province_name", sa.String(length=150), nullable=True)),
    ("sender_district_name", sa.Column("sender_district_name", sa.String(length=150), nullable=True)),
    ("sender_ward_name", sa.Column("sender_ward_name", sa.String(length=150), nullable=True)),
    ("receiver_province_id", sa.Column("receiver_province_id", sa.Integer(), nullable=True)),
    ("receiver_district_id", sa.Column("receiver_district_id", sa.Integer(), nullable=True)),
    ("receiver_ward_id", sa.Column("receiver_ward_id", sa.Integer(), nullable=True)),
    ("receiver_province_name", sa.Column("receiver_province_name", sa.String(length=150), nullable=True)),
    ("receiver_district_name", sa.Column("receiver_district_name", sa.String(length=150), nullable=True)),
    ("receiver_ward_name", sa.Column("receiver_ward_name", sa.String(length=150), nullable=True)),
    ("shop_order_code", sa.Column("shop_order_code", sa.String(length=100), nullable=True)),
    ("order_type", sa.Column("order_type", sa.String(length=30), nullable=True)),
    ("delivery_note_option", sa.Column("delivery_note_option", sa.String(length=100), nullable=True)),
    ("cod_receiver_pays_fee", sa.Column("cod_receiver_pays_fee", sa.Boolean(), server_default=sa.text("false"), nullable=True)),
]

ITEM_COLUMNS = [
    ("product_name", sa.Column("product_name", sa.String(length=255), nullable=True)),
    ("description", sa.Column("description", sa.String(length=255), nullable=True)),
    ("declared_value", sa.Column("declared_value", sa.Numeric(15, 2), server_default=sa.text("0"), nullable=True)),
]


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    waybill_columns = {column["name"] for column in inspector.get_columns("waybills")}
    for name, column in WAYBILL_COLUMNS:
        if name not in waybill_columns:
            op.add_column("waybills", column)

    item_columns = {column["name"] for column in inspector.get_columns("waybill_items")}
    for name, column in ITEM_COLUMNS:
        if name not in item_columns:
            op.add_column("waybill_items", column)

    tables = set(inspector.get_table_names())
    if "waybill_documents" not in tables:
        op.create_table(
            "waybill_documents",
            sa.Column("document_id", sa.Integer(), primary_key=True),
            sa.Column("waybill_id", sa.Integer(), nullable=True),
            sa.Column("document_code", sa.String(length=100), nullable=True),
            sa.Column("document_name", sa.String(length=255), nullable=True),
            sa.Column("quantity", sa.Integer(), server_default=sa.text("1"), nullable=True),
            sa.Column("note", sa.String(length=255), nullable=True),
            sa.ForeignKeyConstraint(["waybill_id"], ["waybills.waybill_id"], name="waybill_documents_waybill_id_fkey"),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "waybill_documents" in set(inspector.get_table_names()):
        op.drop_table("waybill_documents")

    item_columns = {column["name"] for column in inspector.get_columns("waybill_items")}
    for name, _ in reversed(ITEM_COLUMNS):
        if name in item_columns:
            op.drop_column("waybill_items", name)

    waybill_columns = {column["name"] for column in inspector.get_columns("waybills")}
    for name, _ in reversed(WAYBILL_COLUMNS):
        if name in waybill_columns:
            op.drop_column("waybills", name)
