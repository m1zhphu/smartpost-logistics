/**
 * imageHelpers.js
 * Utility functions để xử lý ảnh pickup và POD theo API mới (hỗ trợ tối đa 5 ảnh).
 * Quy tắc: ưu tiên field mảng *_image_urls, fallback về field đơn *_image_url.
 */

/**
 * Lấy danh sách URL ảnh lấy hàng (pickup).
 * @param {Object} data - Object chứa pickup_image_urls và/hoặc pickup_image_url
 * @returns {string[]} Mảng URL ảnh (rỗng nếu không có)
 */
export function getPickupImages(data) {
  if (!data) return [];
  if (Array.isArray(data.pickup_image_urls) && data.pickup_image_urls.length > 0) {
    const urls = data.pickup_image_urls.filter(u => u && u !== 'null' && String(u).trim() !== '');
    if (urls.length > 0) return urls;
  }
  if (data.pickup_image_url && data.pickup_image_url !== 'null' && String(data.pickup_image_url).trim() !== '') {
    return [data.pickup_image_url];
  }
  return [];
}

/**
 * Lấy danh sách URL ảnh giao hàng (POD).
 * @param {Object} data - Object chứa pod_image_urls và/hoặc pod_image_url
 * @returns {string[]} Mảng URL ảnh (rỗng nếu không có)
 */
export function getPodImages(data) {
  if (!data) return [];
  if (Array.isArray(data.pod_image_urls) && data.pod_image_urls.length > 0) {
    const urls = data.pod_image_urls.filter(u => u && u !== 'null' && String(u).trim() !== '');
    if (urls.length > 0) return urls;
  }
  if (data.pod_image_url && data.pod_image_url !== 'null' && String(data.pod_image_url).trim() !== '') {
    return [data.pod_image_url];
  }
  return [];
}
