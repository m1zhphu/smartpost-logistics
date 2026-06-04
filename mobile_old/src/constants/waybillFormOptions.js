/**
 * Các option tĩnh cho form Tạo Vận Đơn
 * Tây Ban Nha là cấp độ loại hình giao dịch (item_type)
 */

/**
 * Loại hình hàng hóa
 * - LETTER: Thư từ (nhẹ, dễ tính)
 * - PARCEL: Bưu phẩm (trung bình)
 * - GOOD: Hàng hóa (lớn, nặng, cần khai giá)
 */
export const ITEM_TYPES = [
  { id: "LETTER", name: "Thư từ" },
  { id: "PARCEL", name: "Bưu phẩm" },
  { id: "GOOD", name: "Hàng hóa" },
];

/**
 * Loại dịch vụ vận chuyển
 * - CPN: Chuẩn (3-5 ngày)
 * - TK: Tiết kiệm (5-7 ngày)
 * - HT: Hỏa tốc (1-2 ngày)
 * - PT9H: Phát trong 9 giờ
 * - QT: Quốc tế
 */
export const SERVICE_TYPES = [
  { id: "CPN", name: "Chuẩn", description: "3-5 ngày" },
  { id: "TK", name: "Tiết kiệm", description: "5-7 ngày" },
  { id: "HT", name: "Hỏa tốc", description: "1-2 ngày" },
  { id: "PT9H", name: "Phát trong 9 giờ", description: "Cùng ngày" },
  { id: "QT", name: "Quốc tế", description: "Giao hàng nước ngoài" },
];

/**
 * Phương thức thanh toán
 * - SENDER_PAY: Người gửi thanh toán
 * - RECEIVER_PAY: Người nhận thanh toán
 * - OWNER_PAY: Chủ shop thanh toán
 */
export const PAYMENT_METHODS = [
  { id: "SENDER_PAY", name: "Người gửi thanh toán" },
  { id: "RECEIVER_PAY", name: "Người nhận thanh toán" },
  { id: "OWNER_PAY", name: "Chủ shop thanh toán" },
];

/**
 * Dịch vụ bổ sung (sẽ fetch từ API)
 * Ví dụ:
 * - HAND_DELIVERY: Phát tận tay
 * - PACKAGING: Đóng gói
 * - SIGNATURE: Yêu cầu chữ ký
 * - DECLARED_VALUE: Khai giá
 */
export const ADDITIONAL_SERVICES_EXAMPLE = [
  { id: "HAND_DELIVERY", name: "Phát tận tay", fee: 10000 },
  { id: "PACKAGING", name: "Đóng gói", fee: 5000 },
  { id: "SIGNATURE", name: "Yêu cầu chữ ký", fee: 3000 },
  { id: "DECLARED_VALUE", name: "Khai giá", fee: 0 },
];

/**
 * Chuyển đổi item_type thành display name
 */
export const getItemTypeName = (id) => {
  const item = ITEM_TYPES.find((t) => t.id === id);
  return item ? item.name : id;
};

/**
 * Chuyển đổi service_type thành display name
 */
export const getServiceTypeName = (id) => {
  const service = SERVICE_TYPES.find((s) => s.id === id);
  return service ? service.name : id;
};

/**
 * Chuyển đổi payment_method thành display name
 */
export const getPaymentMethodName = (id) => {
  const method = PAYMENT_METHODS.find((m) => m.id === id);
  return method ? method.name : id;
};

/**
 * Validate cấu trúc dimensions (length, width, height)
 * @param {Object} dimensions - { length, width, height }
 * @returns {boolean}
 */
export const isValidDimensions = (dimensions) => {
  if (!dimensions) return false;
  const { length, width, height } = dimensions;
  const len = parseFloat(length);
  const wid = parseFloat(width);
  const hei = parseFloat(height);
  return len > 0 && wid > 0 && hei > 0;
};

/**
 * Validate weight
 * @param {string|number} weight
 * @returns {boolean}
 */
export const isValidWeight = (weight) => {
  const w = parseFloat(weight);
  return w > 0 && w <= 30; // Max 30kg
};

/**
 * Validate phone number (Việt Nam)
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  // Loại bỏ ký tự không phải số
  const cleaned = phone.replace(/[^0-9]/g, "");
  // Số điện thoại VN: 10 chữ số, bắt đầu với 0
  return /^0\d{9}$/.test(cleaned);
};

/**
 * Validate COD amount
 * @param {string|number} amount
 * @returns {boolean}
 */
export const isValidCODAmount = (amount) => {
  const a = parseFloat(amount);
  return a >= 0 && a <= 50000000; // Max 50 triệu
};

/**
 * Validate form trước khi submit
 * @param {Object} form - Form state
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export const validateForm = (form) => {
  const errors = [];

  // Validate người gửi
  if (!form.customer_id || form.customer_id.trim() === "") {
    errors.push("Vui lòng chọn khách hàng (người gửi)");
  }
  if (!form.sender_name || form.sender_name.trim() === "") {
    errors.push("Vui lòng nhập tên người gửi");
  }
  if (!isValidPhone(form.sender_phone)) {
    errors.push("Số điện thoại người gửi không hợp lệ");
  }

  // Validate người nhận
  if (!form.receiver_name || form.receiver_name.trim() === "") {
    errors.push("Vui lòng nhập tên người nhận");
  }
  if (!isValidPhone(form.receiver_phone)) {
    errors.push("Số điện thoại người nhận không hợp lệ");
  }
  if (!form.receiver_address || form.receiver_address.trim() === "") {
    errors.push("Vui lòng nhập địa chỉ người nhận");
  }
  if (!form.receiver_province || form.receiver_province.trim() === "") {
    errors.push("Vui lòng chọn tỉnh/thành phố người nhận");
  }

  // Validate hàng hóa
  if (!isValidWeight(form.weight)) {
    errors.push("Cân nặng không hợp lệ (từ 0.1kg - 30kg)");
  }
  if (form.item_type === "GOOD" && !isValidDimensions(form.dimensions)) {
    errors.push("Vui lòng nhập đầy đủ kích thước (D x R x C) cho hàng hóa");
  }
  if (form.cod_amount && !isValidCODAmount(form.cod_amount)) {
    errors.push("Giá trị COD không hợp lệ");
  }

  // Validate dịch vụ
  if (!form.service_type || form.service_type.trim() === "") {
    errors.push("Vui lòng chọn loại dịch vụ");
  }

  // Validate hub
  if (!form.origin_hub_id || form.origin_hub_id.trim() === "") {
    errors.push("Vui lòng chọn hub xuất phát");
  }
  if (!form.dest_hub_id || form.dest_hub_id.trim() === "") {
    errors.push("Vui lòng chọn hub đích");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
