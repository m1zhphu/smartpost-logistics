const getErrorMessage = (data, fallbackMessage) => {
  if (!data) {
    return fallbackMessage;
  }

  if (Array.isArray(data.detail)) {
    return (
      data.detail
        .map((item) => item.msg || item.message || "")
        .filter(Boolean)
        .join(", ") || fallbackMessage
    );
  }

  if (typeof data.detail === "string" && data.detail) {
    return data.detail;
  }

  if (typeof data.message === "string" && data.message) {
    return data.message;
  }

  if (typeof data.error === "string" && data.error) {
    return data.error;
  }

  return fallbackMessage;
};

const parseJsonSafely = async (response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return { raw: text };
  }
};

export const createAuthHeaders = (token, extraHeaders) => {
  const headers = {
    ...(extraHeaders || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const generateIdempotencyKey = () =>
  `idempotency_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

const ensureIdempotencyHeader = (options = {}) => {
  const method = (options.method || "GET").toUpperCase();
  if (method === "POST") {
    const headers = options.headers || {};

    const hasHeader = headers["Idempotency-Key"] || headers["idempotency-key"];

    if (!hasHeader) {
      const mergedHeaders = {
        ...headers,
        "Idempotency-Key": generateIdempotencyKey(),
      };
      return {
        ...options,
        headers: mergedHeaders,
      };
    }
  }

  return options;
};

export const requestJson = async (
  url,
  options = {},
  fallbackMessage = "Lỗi không xác định. Vui lòng thử lại.",
) => {
  try {
    const requestOptions = ensureIdempotencyHeader(options);
    const response = await fetch(url, requestOptions);
    const data = await parseJsonSafely(response);

    if (!response.ok) {
      const err = new Error(getErrorMessage(data, fallbackMessage));
      err.status = response.status;
      throw err;
    }

    return data;
  } catch (error) {
    if (error.message && error.message !== "Network request failed") {
      throw error;
    }

    throw new Error("Lỗi không xác định. Vui lòng thử lại.");
  }
};

export const requestArrayBuffer = async (
  url,
  options = {},
  fallbackMessage = "Không thể tải file.",
) => {
  try {
    const requestOptions = ensureIdempotencyHeader(options);
    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const data = await parseJsonSafely(response);
      throw new Error(getErrorMessage(data, fallbackMessage));
    }

    return response.arrayBuffer();
  } catch (error) {
    if (error.message && error.message !== "Network request failed") {
      throw error;
    }

    throw new Error("Loi khong xac dinh. Vui long thu lai.");
  }
};
