import { ENDPOINTS } from "../constants/data";
import { createAuthHeaders, requestJson } from "./apiClient";

export const uploadService = {
  uploadPOD: async (token, imageUri) => {
    const formData = new FormData();

    formData.append("file", {
      uri: imageUri,
      name: `pod_${Date.now()}.jpg`,
      type: "image/jpeg",
    });

    const data = await requestJson(
      ENDPOINTS.UPLOAD_POD,
      {
        method: "POST",
        headers: createAuthHeaders(token),
        body: formData,
      },
      "Không thể tải ảnh POD lên server.",
    );

    return data ? data.image_url : "";
  },

  uploadBillImage: async (token, imageUri, isPickup = false) => {
    const formData = new FormData();

    formData.append("file", {
      uri: imageUri,
      name: `bill_${Date.now()}.jpg`,
      type: "image/jpeg",
    });
    formData.append("is_pickup", isPickup);

    const data = await requestJson(
      ENDPOINTS.UPLOAD_BILL_IMAGE,
      {
        method: "POST",
        headers: createAuthHeaders(token),
        body: formData,
      },
      "Không thể tải ảnh bill lên server.",
    );

    return data ? data.image_url : "";
  },
};
