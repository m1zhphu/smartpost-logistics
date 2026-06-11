import pytest
from pydantic import ValidationError

from core.product_types import get_product_type_catalog, normalize_product_type
from schemas.waybills import CustomerPickupItem, WaybillCreate


def test_catalog_contains_seven_supported_types():
    assert [item["code"] for item in get_product_type_catalog()] == [
        "DOCUMENT", "PARCEL", "GENERAL", "LIQUID", "ELECTRONIC", "FOOD", "HIGH_VALUE"
    ]


@pytest.mark.parametrize(
    ("raw_value", "expected"),
    [
        ("Thư từ/Tài liệu", "DOCUMENT"),
        ("Bưu phẩm bưu kiện", "PARCEL"),
        ("Hàng hóa thông thường", "GENERAL"),
        ("CHẤT LỎNG", "LIQUID"),
        ("ĐIỆN TỬ", "ELECTRONIC"),
        ("THỰC PHẨM", "FOOD"),
        ("GIÁ TRỊ CAO", "HIGH_VALUE"),
    ],
)
def test_vietnamese_aliases_are_normalized(raw_value, expected):
    assert normalize_product_type(raw_value) == expected


def test_high_value_item_requires_declared_value():
    with pytest.raises(ValidationError):
        CustomerPickupItem(product_group="HIGH_VALUE", weight=1, declared_value=0)


def test_legacy_waybill_accepts_product_group_and_declared_value():
    data = WaybillCreate(
        receiver_name="Receiver",
        receiver_phone="0900000000",
        receiver_address="Address",
        actual_weight=1,
        product_group="GIÁ TRỊ CAO",
        declared_value=1_000_000,
    )
    assert data.product_group == "HIGH_VALUE"
