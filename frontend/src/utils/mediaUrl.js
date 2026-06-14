import api from '@/api/axios'

export const getMediaUrl = (value) => {
  if (!value) return ''

  const raw = String(value).trim()
  const uploadsIndex = raw.indexOf('/uploads/')
  const mediaPath = uploadsIndex >= 0 ? raw.slice(uploadsIndex) : raw
  const configuredBase = String(api.defaults.baseURL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

  if (uploadsIndex >= 0 && configuredBase) return `${configuredBase}${mediaPath}`
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) return raw
  return `${configuredBase}${raw.startsWith('/') ? raw : `/${raw}`}`
}
