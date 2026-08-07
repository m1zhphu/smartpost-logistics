import api from '@/api/axios'

export const getMediaUrl = (value) => {
  if (!value) return ''

  const raw = String(value).trim()
  const configuredBase = String(api.defaults.baseURL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

  const uploadsIndex = raw.indexOf('/uploads/')
  if (uploadsIndex >= 0) {
    const mediaPath = raw.slice(uploadsIndex)
    if (configuredBase) {
      return `${configuredBase}${mediaPath}`
    }
  }

  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) return raw

  return `${configuredBase}${raw.startsWith('/') ? raw : `/${raw}`}`
}
