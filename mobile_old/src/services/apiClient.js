import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_USER_KEY = "@SpeedlightAppFn:user";

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

const getStoredUser = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_USER_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.warn("Failed to read stored user for auth headers", error);
    return null;
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

export const createAuthHeadersAsync = async (extraHeaders = {}) => {
  const storedUser = await getStoredUser();
  const headers = {
    ...extraHeaders,
  };

  if (storedUser?.token) {
    headers.Authorization = `Bearer ${storedUser.token}`;
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

const handleErrorResponse = async (response, fallbackMessage) => {
  const data = await parseJsonSafely(response);
  const message = getErrorMessage(data, fallbackMessage);
  const error = new Error(message);
  error.status = response.status;
  error.data = data;
  if (response.status === 401) {
    error.isUnauthorized = true;
  }
  if (response.status >= 500) {
    error.isServerError = true;
  }
  throw error;
};

export const requestJson = async (
  url,
  options = {},
  fallbackMessage = "Lỗi không xác định. Vui lòng thử lại.",
) => {
  try {
    const requestOptions = ensureIdempotencyHeader(options);
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      await handleErrorResponse(response, fallbackMessage);
    }
    return await parseJsonSafely(response);
  } catch (error) {
    if (error.message && error.message !== "Network request failed") {
      throw error;
    }
    throw new Error("Lỗi không xác định. Vui lòng thử lại.");
  }
};

export const requestJsonWithAuth = async (
  url,
  options = {},
  fallbackMessage = "Lỗi không xác định. Vui lòng thử lại.",
) => {
  try {
    const authHeaders = await createAuthHeadersAsync(options.headers || {});
    const requestOptions = ensureIdempotencyHeader({
      ...options,
      headers: authHeaders,
    });
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      await handleErrorResponse(response, fallbackMessage);
    }
    return await parseJsonSafely(response);
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
      await handleErrorResponse(response, fallbackMessage);
    }

    return response.arrayBuffer();
  } catch (error) {
    if (error.message && error.message !== "Network request failed") {
      throw error;
    }
    throw new Error("Lỗi không xác định. Vui lòng thử lại.");
  }
};
