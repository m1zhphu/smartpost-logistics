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
  // An Giang = Kiên Giang + An Giang
  "Kiên Giang": "An Giang",
  "An Giang": "An Giang",
  // Bắc Ninh = Bắc Giang + Bắc Ninh
  "Bắc Giang": "Bắc Ninh",
  "Bắc Ninh": "Bắc Ninh",
  // Cà Mau = Bạc Liêu + Cà Mau
  "Bạc Liêu": "Cà Mau",
  "Cà Mau": "Cà Mau",
  // Cao Bằng — giữ nguyên
  "Cao Bằng": "Cao Bằng",
  // TP. Cần Thơ = Sóc Trăng + Hậu Giang + TP. Cần Thơ
  "Sóc Trăng": "TP. Cần Thơ",
  "Hậu Giang": "TP. Cần Thơ",
  "Cần Thơ": "TP. Cần Thơ",
  "TP. Cần Thơ": "TP. Cần Thơ",
  // TP. Đà Nẵng = Quảng Nam + TP. Đà Nẵng
  "Quảng Nam": "TP. Đà Nẵng",
  "Đà Nẵng": "TP. Đà Nẵng",
  "TP. Đà Nẵng": "TP. Đà Nẵng",
  // Đắk Lắk = Phú Yên + Đắk Lắk
  "Phú Yên": "Đắk Lắk",
  "Đắk Lắk": "Đắk Lắk",
  // Điện Biên — giữ nguyên
  "Điện Biên": "Điện Biên",
  // Đồng Nai = Bình Phước + Đồng Nai
  "Bình Phước": "Đồng Nai",
  "Đồng Nai": "Đồng Nai",
  // Đồng Tháp = Tiền Giang + Đồng Tháp
  "Tiền Giang": "Đồng Tháp",
  "Đồng Tháp": "Đồng Tháp",
  // Gia Lai = Gia Lai + Bình Định
  "Bình Định": "Gia Lai",
  "Gia Lai": "Gia Lai",
  // TP. Hà Nội — giữ nguyên
  "Hà Nội": "TP. Hà Nội",
  "TP. Hà Nội": "TP. Hà Nội",
  // Hà Tĩnh — giữ nguyên
  "Hà Tĩnh": "Hà Tĩnh",
  // TP. Hải Phòng = Hải Dương + TP. Hải Phòng
  "Hải Dương": "TP. Hải Phòng",
  "Hải Phòng": "TP. Hải Phòng",
  "TP. Hải Phòng": "TP. Hải Phòng",
  // TP. Hồ Chí Minh = Bình Dương + TPHCM + Bà Rịa – Vũng Tàu
  "Bình Dương": "TP. Hồ Chí Minh",
  "Bà Rịa - Vũng Tàu": "TP. Hồ Chí Minh",
  "Bà Rịa–Vũng Tàu": "TP. Hồ Chí Minh",
  "Bà Rịa – Vũng Tàu": "TP. Hồ Chí Minh",
  "Vũng Tàu": "TP. Hồ Chí Minh",
  "Hồ Chí Minh": "TP. Hồ Chí Minh",
  "TP. Hồ Chí Minh": "TP. Hồ Chí Minh",
  "TP.HCM": "TP. Hồ Chí Minh",
  "TPHCM": "TP. Hồ Chí Minh",
  // TP. Huế — giữ nguyên
  "Huế": "TP. Huế",
  "Thừa Thiên Huế": "TP. Huế",
  "TP. Huế": "TP. Huế",
  // Hưng Yên = Thái Bình + Hưng Yên
  "Thái Bình": "Hưng Yên",
  "Hưng Yên": "Hưng Yên",
  // Khánh Hoà = Khánh Hòa + Ninh Thuận
  "Ninh Thuận": "Khánh Hoà",
  "Khánh Hòa": "Khánh Hoà",
  "Khánh Hoà": "Khánh Hoà",
  // Lai Châu — giữ nguyên
  "Lai Châu": "Lai Châu",
  // Lạng Sơn — giữ nguyên
  "Lạng Sơn": "Lạng Sơn",
  // Lào Cai = Lào Cai + Yên Bái
  "Yên Bái": "Lào Cai",
  "Lào Cai": "Lào Cai",
  // Lâm Đồng = Đắk Nông + Lâm Đồng + Bình Thuận
  "Đắk Nông": "Lâm Đồng",
  "Bình Thuận": "Lâm Đồng",
  "Lâm Đồng": "Lâm Đồng",
  // Nghệ An — giữ nguyên
  "Nghệ An": "Nghệ An",
  // Ninh Bình = Hà Nam + Ninh Bình + Nam Định
  "Hà Nam": "Ninh Bình",
  "Nam Định": "Ninh Bình",
  "Ninh Bình": "Ninh Bình",
  // Phú Thọ = Hòa Bình + Vĩnh Phúc + Phú Thọ
  "Hòa Bình": "Phú Thọ",
  "Vĩnh Phúc": "Phú Thọ",
  "Phú Thọ": "Phú Thọ",
  // Quảng Ngãi = Quảng Ngãi + Kon Tum
  "Kon Tum": "Quảng Ngãi",
  "Quảng Ngãi": "Quảng Ngãi",
  // Quảng Ninh — giữ nguyên
  "Quảng Ninh": "Quảng Ninh",
  // Quảng Trị = Quảng Bình + Quảng Trị
  "Quảng Bình": "Quảng Trị",
  "Quảng Trị": "Quảng Trị",
  // Sơn La — giữ nguyên
  "Sơn La": "Sơn La",
  // Tây Ninh = Long An + Tây Ninh
  "Long An": "Tây Ninh",
  "Tây Ninh": "Tây Ninh",
  // Thái Nguyên = Bắc Kạn + Thái Nguyên
  "Bắc Kạn": "Thái Nguyên",
  "Thái Nguyên": "Thái Nguyên",
  // Thanh Hóa — giữ nguyên
  "Thanh Hóa": "Thanh Hóa",
  "Thanh Hoá": "Thanh Hóa",
  // Tuyên Quang = Hà Giang + Tuyên Quang
  "Hà Giang": "Tuyên Quang",
  "Tuyên Quang": "Tuyên Quang",
  // Vĩnh Long = Bến Tre + Vĩnh Long + Trà Vinh
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
