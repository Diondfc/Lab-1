import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${p}`
}

/** Static upload filenames from the API join to `/uploads/...` (proxied in dev when API_BASE is empty). */
export function uploadsUrl(coverImagePath, fallbackName = 'default.png') {
  const raw =
    typeof coverImagePath === 'string' && coverImagePath.trim()
      ? coverImagePath.split(/[/\\]/).pop()
      : fallbackName
  const name = raw && raw.trim() ? raw.trim() : fallbackName
  return apiUrl(`/uploads/${name}`)
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
})

