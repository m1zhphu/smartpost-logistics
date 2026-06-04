/**
 * Hàm debounce cơ bản (vanilla JavaScript)
 * Sử dụng để chống spam API cho các tính năng như:
 * - Tìm kiếm khách hàng
 * - Auto-calculate phí
 *
 * @param {Function} fn - Hàm callback cần debounce
 * @param {number} wait - Thời gian chờ (ms), mặc định 500ms
 * @returns {Function} Hàm debounced
 *
 * @example
 * const debouncedSearch = debounce((query) => {
 *   fetch(`/api/customers/search?q=${query}`);
 * }, 500);
 *
 * // Trong component
 * onChangeText={(text) => debouncedSearch(text)}
 */
export function debounce(fn, wait = 500) {
  let timer = null;

  return function (...args) {
    // Hủy timer cũ nếu có
    if (timer) {
      clearTimeout(timer);
    }

    // Khởi tạo timer mới
    timer = setTimeout(() => {
      timer = null;
      try {
        fn.apply(this, args);
      } catch (e) {
        console.warn("[debounce] handler error", e);
      }
    }, wait);
  };
}

/**
 * Hàm debounce với cancel method
 * Cho phép hủy debounce trước khi callback chạy
 *
 * @param {Function} fn - Hàm callback
 * @param {number} wait - Thời gian chờ (ms)
 * @returns {Object} { fn: Function, cancel: Function }
 *
 * @example
 * const { fn: debouncedSearch, cancel } = debounceWithCancel((query) => {
 *   searchAPI(query);
 * }, 500);
 *
 * // Dùng
 * onChangeText={debouncedSearch}
 * // Hủy nếu cần
 * onBlur={() => cancel()}
 */
export function debounceWithCancel(fn, wait = 500) {
  let timer = null;

  const debounced = function (...args) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      try {
        fn.apply(this, args);
      } catch (e) {
        console.warn("[debounceWithCancel] handler error", e);
      }
    }, wait);
  };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
}

/**
 * Hàm throttle (khác debounce)
 * Thực thi function mỗi `wait`ms thay vì chỉ sau khi ngừng
 * Hữu ích cho: scroll, resize, auto-calculate liên tục
 *
 * @param {Function} fn - Hàm callback
 * @param {number} wait - Khoảng thời gian tối thiểu (ms)
 * @returns {Function} Hàm throttled
 *
 * @example
 * const throttledCalc = throttle((data) => {
 *   calculatePricing(data);
 * }, 1000);
 */
export function throttle(fn, wait = 500) {
  let lastCall = 0;

  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= wait) {
      lastCall = now;
      try {
        fn.apply(this, args);
      } catch (e) {
        console.warn("[throttle] handler error", e);
      }
    }
  };
}

export default debounce;
