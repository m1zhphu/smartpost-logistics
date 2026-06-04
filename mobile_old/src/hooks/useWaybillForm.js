import { useReducer, useCallback } from "react";

/**
 * Cấu trúc state form mặc định cho tạo vận đơn
 */
export const INITIAL_FORM_STATE = {
  // Thông tin người gửi
  customer_code: "",
  customer_id: "",
  sender_name: "",
  sender_phone: "",
  sender_address: "",
  sender_province: "",

  // Thông tin người nhận
  receiver_name: "",
  receiver_phone: "",
  receiver_address: "",
  receiver_province: "",

  // Thông tin hàng hóa
  item_type: "PARCEL", // LETTER / PARCEL / GOOD
  weight: "0.5",
  dimensions: {
    length: "",
    width: "",
    height: "",
  },
  cod_amount: "0",

  // Dịch vụ
  service_type: "CPN", // CPN/TK/HT/PT9H/QT
  additional_services: [],

  // Chi tiết phí
  feeBreakdown: {
    main_fee: 0,
    fuel_surcharge: 0,
    vat: 0,
    extra_fee: 0,
    total_fee: 0,
  },

  // Thông tin khác
  origin_hub_id: "",
  dest_hub_id: "",
  product_name: "",
  payment_method: "SENDER_PAY",
  note: "",
  receiver_address_detail: "",
  bank_branch: "",
  unit_code: "",
  waybill_code: "",
};

/**
 * Reducer để quản lý state form vận đơn
 * @param {Object} state - State hiện tại
 * @param {Object} action - Action object
 * @returns {Object} State mới
 */
export function formReducer(state, action) {
  switch (action.type) {
    // Cập nhật một hoặc nhiều field
    case "UPDATE_FIELD":
      return {
        ...state,
        [action.field]: action.value,
      };

    // Cập nhật nhiều field cùng lúc (merge)
    case "PATCH":
      return {
        ...state,
        ...action.payload,
      };

    // Thay thế toàn bộ state
    case "REPLACE":
      return action.payload;

    // Cập nhật dimensions (length, width, height)
    case "UPDATE_DIMENSIONS":
      return {
        ...state,
        dimensions: {
          ...state.dimensions,
          ...action.payload,
        },
      };

    // Cập nhật service_type và additional_services
    case "UPDATE_SERVICES":
      return {
        ...state,
        service_type: action.payload.service_type ?? state.service_type,
        additional_services:
          action.payload.additional_services ?? state.additional_services,
      };

    // Cập nhật fee breakdown
    case "SET_FEE":
      return {
        ...state,
        feeBreakdown: {
          ...state.feeBreakdown,
          ...action.payload,
        },
      };

    // Reset form về state mặc định
    case "RESET":
      return { ...INITIAL_FORM_STATE };

    default:
      return state;
  }
}

/**
 * Hook tùy chỉnh để quản lý form vận đơn
 * Sử dụng useReducer để tối ưu performance
 *
 * @param {Object} initialState - State ban đầu (mặc định: INITIAL_FORM_STATE)
 * @returns {Object} { form, dispatchForm, setForm, resetForm }
 */
export function useWaybillForm(initialState = INITIAL_FORM_STATE) {
  const [form, dispatchForm] = useReducer(formReducer, initialState);

  /**
   * Helper function để tương thích với cách dùng setForm(fn) hoặc setForm(object)
   * Cho phép code cũ tiếp tục hoạt động mà không cần thay đổi
   */
  const setForm = useCallback(
    (patch) => {
      if (typeof patch === "function") {
        // Nếu là function, gọi function với state hiện tại rồi replace
        const next = patch(form);
        dispatchForm({ type: "REPLACE", payload: next });
      } else if (typeof patch === "object" && patch !== null) {
        // Nếu là object, merge vào state hiện tại
        dispatchForm({ type: "PATCH", payload: patch });
      }
    },
    [form],
  );

  /**
   * Reset form về state mặc định
   */
  const resetForm = useCallback(() => {
    dispatchForm({ type: "RESET" });
  }, []);

  /**
   * Cập nhật một field đơn lẻ
   */
  const updateField = useCallback((field, value) => {
    dispatchForm({ type: "UPDATE_FIELD", field, value });
  }, []);

  /**
   * Cập nhật dimensions
   */
  const updateDimensions = useCallback((dimensions) => {
    dispatchForm({ type: "UPDATE_DIMENSIONS", payload: dimensions });
  }, []);

  /**
   * Cập nhật services
   */
  const updateServices = useCallback((services) => {
    dispatchForm({ type: "UPDATE_SERVICES", payload: services });
  }, []);

  /**
   * Cập nhật fee breakdown
   */
  const setFeeBreakdown = useCallback((feeData) => {
    dispatchForm({ type: "SET_FEE", payload: feeData });
  }, []);

  return {
    form,
    dispatchForm,
    setForm,
    resetForm,
    updateField,
    updateDimensions,
    updateServices,
    setFeeBreakdown,
  };
}

export default useWaybillForm;
