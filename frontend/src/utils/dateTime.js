const TIMEZONE_SUFFIX = /(Z|[+-]\d{2}:?\d{2})$/i;
const API_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export function parseApiDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const normalized = typeof value === 'string' && API_DATETIME.test(value) && !TIMEZONE_SUFFIX.test(value)
    ? `${value}Z`
    : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatVietnamDateTime(value, fallback = '---') {
  const date = parseApiDate(value);
  if (!date) return fallback;

  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${values.hour}:${values.minute} ${values.day}/${values.month}/${values.year}`;
}
