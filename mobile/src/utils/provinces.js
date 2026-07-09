export const PROVINCES_34 = [
  "An Giang",
  "Bắc Ninh",
  "Cà Mau",
  "Cao Bằng",
  "TP. Cần Thơ",
  "TP. Đà Nẵng",
  "Đắk Lắk",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "TP. Hà Nội",
  "Hà Tĩnh",
  "TP. Hải Phòng",
  "TP. Hồ Chí Minh",
  "TP. Huế",
  "Hưng Yên",
  "Khánh Hoà",
  "Lai Châu",
  "Lạng Sơn",
  "Lào Cai",
  "Lâm Đồng",
  "Nghệ An",
  "Ninh Bình",
  "Phú Thọ",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sơn La",
  "Tây Ninh",
  "Thái Nguyên",
  "Thanh Hóa",
  "Tuyên Quang",
  "Vĩnh Long",
];

/**
 * Mapping từ tỉnh/thành phố CŨ sang tỉnh MỚI sau sáp nhập 2025.
 * Dùng để hiển thị địa chỉ: ưu tiên tỉnh mới, hiển thị tỉnh cũ là phụ.
 */
export const OLD_TO_NEW_PROVINCE = {
  "Kiên Giang": "An Giang",
  "An Giang": "An Giang",
  "Bắc Giang": "Bắc Ninh",
  "Bắc Ninh": "Bắc Ninh",
  "Bạc Liêu": "Cà Mau",
  "Cà Mau": "Cà Mau",
  "Cao Bằng": "Cao Bằng",
  "Sóc Trăng": "TP. Cần Thơ",
  "Hậu Giang": "TP. Cần Thơ",
  "Cần Thơ": "TP. Cần Thơ",
  "TP. Cần Thơ": "TP. Cần Thơ",
  "Quảng Nam": "TP. Đà Nẵng",
  "Đà Nẵng": "TP. Đà Nẵng",
  "TP. Đà Nẵng": "TP. Đà Nẵng",
  "Phú Yên": "Đắk Lắk",
  "Đắk Lắk": "Đắk Lắk",
  "Điện Biên": "Điện Biên",
  "Bình Phước": "Đồng Nai",
  "Đồng Nai": "Đồng Nai",
  "Tiền Giang": "Đồng Tháp",
  "Đồng Tháp": "Đồng Tháp",
  "Bình Định": "Gia Lai",
  "Gia Lai": "Gia Lai",
  "Hà Nội": "TP. Hà Nội",
  "TP. Hà Nội": "TP. Hà Nội",
  "Hà Tĩnh": "Hà Tĩnh",
  "Hải Dương": "TP. Hải Phòng",
  "Hải Phòng": "TP. Hải Phòng",
  "TP. Hải Phòng": "TP. Hải Phòng",
  "Bình Dương": "TP. Hồ Chí Minh",
  "Bà Rịa - Vũng Tàu": "TP. Hồ Chí Minh",
  "Bà Rịa–Vũng Tàu": "TP. Hồ Chí Minh",
  "Vũng Tàu": "TP. Hồ Chí Minh",
  "Hồ Chí Minh": "TP. Hồ Chí Minh",
  "TP. Hồ Chí Minh": "TP. Hồ Chí Minh",
  "TP.HCM": "TP. Hồ Chí Minh",
  "TPHCM": "TP. Hồ Chí Minh",
  "Huế": "TP. Huế",
  "Thừa Thiên Huế": "TP. Huế",
  "TP. Huế": "TP. Huế",
  "Thái Bình": "Hưng Yên",
  "Hưng Yên": "Hưng Yên",
  "Ninh Thuận": "Khánh Hoà",
  "Khánh Hòa": "Khánh Hoà",
  "Khánh Hoà": "Khánh Hoà",
  "Lai Châu": "Lai Châu",
  "Lạng Sơn": "Lạng Sơn",
  "Yên Bái": "Lào Cai",
  "Lào Cai": "Lào Cai",
  "Đắk Nông": "Lâm Đồng",
  "Bình Thuận": "Lâm Đồng",
  "Lâm Đồng": "Lâm Đồng",
  "Nghệ An": "Nghệ An",
  "Hà Nam": "Ninh Bình",
  "Nam Định": "Ninh Bình",
  "Ninh Bình": "Ninh Bình",
  "Hòa Bình": "Phú Thọ",
  "Vĩnh Phúc": "Phú Thọ",
  "Phú Thọ": "Phú Thọ",
  "Kon Tum": "Quảng Ngãi",
  "Quảng Ngãi": "Quảng Ngãi",
  "Quảng Ninh": "Quảng Ninh",
  "Quảng Bình": "Quảng Trị",
  "Quảng Trị": "Quảng Trị",
  "Sơn La": "Sơn La",
  "Long An": "Tây Ninh",
  "Tây Ninh": "Tây Ninh",
  "Bắc Kạn": "Thái Nguyên",
  "Thái Nguyên": "Thái Nguyên",
  "Thanh Hóa": "Thanh Hóa",
  "Hà Giang": "Tuyên Quang",
  "Tuyên Quang": "Tuyên Quang",
  "Bến Tre": "Vĩnh Long",
  "Trà Vinh": "Vĩnh Long",
  "Vĩnh Long": "Vĩnh Long",
};

/**
 * Tìm tỉnh mới từ tên tỉnh cũ hoặc mới.
 * @param {string} provinceName - Tên tỉnh bất kỳ
 * @returns {string} Tên tỉnh mới (34 tỉnh), hoặc tên gốc nếu không tìm thấy
 */
export const resolveToNewProvince = (provinceName) => {
  if (!provinceName) return "";
  return OLD_TO_NEW_PROVINCE[provinceName.trim()] || provinceName.trim();
};

/**
 * Lấy danh sách tên tỉnh CŨ map vào một tỉnh MỚI.
 * @param {string} newProvince - Tên tỉnh mới (34 tỉnh)
 * @returns {string[]} Mảng tên tỉnh cũ (loại trừ chính tỉnh mới đó)
 */
export const getOldProvinceNames = (newProvince) => {
  return Object.entries(OLD_TO_NEW_PROVINCE)
    .filter(([, newP]) => newP === newProvince)
    .map(([oldP]) => oldP)
    .filter((p) => p !== newProvince);
};
