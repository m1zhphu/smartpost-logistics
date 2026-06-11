"""standardize product types

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
"""

from typing import Union

from alembic import op


revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, None] = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


CANONICAL_TYPES = "'DOCUMENT', 'PARCEL', 'GENERAL', 'LIQUID', 'ELECTRONIC', 'FOOD', 'HIGH_VALUE'"


def _normalize_column(table: str, column: str, fallback: str) -> None:
    op.execute(f"""
        UPDATE {table}
        SET {column} = CASE
            WHEN {column} IS NULL OR BTRIM({column}) = '' THEN '{fallback}'
            WHEN UPPER(BTRIM({column})) IN ('DOCUMENT', 'LETTER', 'DOC', 'THU_TU', 'TAI_LIEU', 'THU_TU_TAI_LIEU') THEN 'DOCUMENT'
            WHEN UPPER(BTRIM({column})) IN ('PARCEL', 'PACKAGE', 'BUU_PHAM', 'BUU_KIEN', 'BUU_PHAM_BUU_KIEN') THEN 'PARCEL'
            WHEN UPPER(BTRIM({column})) IN ('GENERAL', 'GOODS', 'NORMAL_GOODS', 'HANG_HOA', 'HANG_HOA_THONG_THUONG') THEN 'GENERAL'
            WHEN UPPER(BTRIM({column})) IN ('LIQUID', 'CHAT_LONG') THEN 'LIQUID'
            WHEN UPPER(BTRIM({column})) IN ('ELECTRONIC', 'ELECTRONICS', 'DIEN_TU') THEN 'ELECTRONIC'
            WHEN UPPER(BTRIM({column})) IN ('FOOD', 'THUC_PHAM') THEN 'FOOD'
            WHEN UPPER(BTRIM({column})) IN ('HIGH_VALUE', 'VALUABLE', 'GIA_TRI_CAO') THEN 'HIGH_VALUE'
            ELSE '{fallback}'
        END
    """)


def upgrade() -> None:
    _normalize_column("booking_requests", "product_type", "PARCEL")
    _normalize_column("waybill_items", "product_group", "PARCEL")
    op.alter_column("booking_requests", "product_type", server_default="PARCEL")
    op.alter_column("waybill_items", "product_group", server_default="PARCEL")
    op.create_check_constraint(
        "ck_booking_requests_product_type",
        "booking_requests",
        f"product_type IN ({CANONICAL_TYPES})",
    )
    op.create_check_constraint(
        "ck_waybill_items_product_group",
        "waybill_items",
        f"product_group IN ({CANONICAL_TYPES})",
    )


def downgrade() -> None:
    op.drop_constraint("ck_waybill_items_product_group", "waybill_items", type_="check")
    op.drop_constraint("ck_booking_requests_product_type", "booking_requests", type_="check")
    op.alter_column("waybill_items", "product_group", server_default=None)
    op.alter_column("booking_requests", "product_type", server_default=None)
