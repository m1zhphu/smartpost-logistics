import re
import unicodedata
from typing import Any


PRODUCT_TYPES: dict[str, dict[str, Any]] = {
    "DOCUMENT": {"code": "DOCUMENT", "label": "Thư từ/Tài liệu", "special_handling": False, "requires_declared_value": False, "packing_recommended": False, "handling_note": "Dùng cho thư từ, hồ sơ và tài liệu giấy."},
    "PARCEL": {"code": "PARCEL", "label": "Bưu phẩm, bưu kiện", "special_handling": False, "requires_declared_value": False, "packing_recommended": False, "handling_note": "Dùng cho bưu phẩm và bưu kiện thông thường."},
    "GENERAL": {"code": "GENERAL", "label": "Hàng hóa thông thường", "special_handling": False, "requires_declared_value": False, "packing_recommended": False, "handling_note": "Hàng hóa không thuộc nhóm cần xử lý đặc biệt."},
    "LIQUID": {"code": "LIQUID", "label": "Chất lỏng", "special_handling": True, "requires_declared_value": False, "packing_recommended": True, "handling_note": "Cần bao gói chống rò rỉ và kiểm tra điều kiện vận chuyển."},
    "ELECTRONIC": {"code": "ELECTRONIC", "label": "Điện tử", "special_handling": True, "requires_declared_value": False, "packing_recommended": True, "handling_note": "Cần chống va đập; khai báo pin hoặc linh kiện hạn chế nếu có."},
    "FOOD": {"code": "FOOD", "label": "Thực phẩm", "special_handling": True, "requires_declared_value": False, "packing_recommended": True, "handling_note": "Cần khai báo điều kiện bảo quản và hạn sử dụng phù hợp."},
    "HIGH_VALUE": {"code": "HIGH_VALUE", "label": "Giá trị cao", "special_handling": True, "requires_declared_value": True, "packing_recommended": True, "handling_note": "Bắt buộc khai giá lớn hơn 0 để kiểm soát và bảo hiểm hàng hóa."},
}


def _alias_key(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value.strip().upper())
    without_accents = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return re.sub(r"[^A-Z0-9]+", "_", without_accents).strip("_")


_ALIASES = {
    "DOCUMENT": "DOCUMENT", "LETTER": "DOCUMENT", "DOC": "DOCUMENT", "THU_TU": "DOCUMENT", "TAI_LIEU": "DOCUMENT", "THU_TU_TAI_LIEU": "DOCUMENT",
    "PARCEL": "PARCEL", "PACKAGE": "PARCEL", "BUU_PHAM": "PARCEL", "BUU_KIEN": "PARCEL", "BUU_PHAM_BUU_KIEN": "PARCEL",
    "GENERAL": "GENERAL", "GOODS": "GENERAL", "NORMAL_GOODS": "GENERAL", "HANG_HOA": "GENERAL", "HANG_HOA_THONG_THUONG": "GENERAL",
    "LIQUID": "LIQUID", "CHAT_LONG": "LIQUID",
    "ELECTRONIC": "ELECTRONIC", "ELECTRONICS": "ELECTRONIC", "DIEN_TU": "ELECTRONIC",
    "FOOD": "FOOD", "THUC_PHAM": "FOOD",
    "HIGH_VALUE": "HIGH_VALUE", "VALUABLE": "HIGH_VALUE", "GIA_TRI_CAO": "HIGH_VALUE",
}


def normalize_product_type(value: str | None, default: str = "PARCEL") -> str:
    if value is None or not str(value).strip():
        return default
    canonical = _ALIASES.get(_alias_key(str(value)))
    if not canonical:
        raise ValueError(f"Loại hàng không hợp lệ. Giá trị hợp lệ: {', '.join(PRODUCT_TYPES)}")
    return canonical


def get_product_type_definition(value: str) -> dict[str, Any]:
    return PRODUCT_TYPES[normalize_product_type(value)].copy()


def get_product_type_catalog() -> list[dict[str, Any]]:
    return [definition.copy() for definition in PRODUCT_TYPES.values()]
