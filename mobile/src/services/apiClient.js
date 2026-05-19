const getErrorMessage = (data, fallbackMessage) => {
    if (!data) {
        return fallbackMessage;
    }

    if (Array.isArray(data.detail)) {
        return data.detail.map((item) => item.msg || item.message || '').filter(Boolean).join(', ') || fallbackMessage;
    }

    if (typeof data.detail === 'string' && data.detail) {
        return data.detail;
    }

    if (typeof data.message === 'string' && data.message) {
        return data.message;
    }

    if (typeof data.error === 'string' && data.error) {
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

export const requestJson = async (url, options = {}, fallbackMessage = 'Lỗi không xác định. Vui lòng thử lại.') => {
    try {
        const response = await fetch(url, options);
        const data = await parseJsonSafely(response);

        if (!response.ok) {
            throw new Error(getErrorMessage(data, fallbackMessage));
        }

        return data;
    } catch (error) {
        if (error.message && error.message !== 'Network request failed') {
            throw error;
        }

        throw new Error('Lỗi không xác định. Vui lòng thử lại.');
    }
};

export const requestArrayBuffer = async (url, options = {}, fallbackMessage = 'Không thể tải file.') => {
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            const data = await parseJsonSafely(response);
            throw new Error(getErrorMessage(data, fallbackMessage));
        }

        return response.arrayBuffer();
    } catch (error) {
        if (error.message && error.message !== 'Network request failed') {
            throw error;
        }

        throw new Error('Loi khong xac dinh. Vui long thu lai.');
    }
};
