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

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let pendingRequests = []

function resolvePendingRequests(newToken) {
  pendingRequests.forEach((callback) => callback(newToken))
  pendingRequests = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status
    const code = error.response?.data?.code

    if (status === 401 && code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push((newToken) => {
            if (!newToken) {
              reject(error)
              return
            }
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(apiClient(originalRequest))
          })
        })
      }

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        return Promise.reject(error)
      }

      isRefreshing = true

      try {
        const { data } = await axios.post(apiUrl('/api/auth/refresh'), { refreshToken }, {
          headers: { 'Content-Type': 'application/json' },
        })

        if (!data?.token) {
          throw new Error('No token returned from refresh endpoint')
        }

        localStorage.setItem('token', data.token)
        resolvePendingRequests(data.token)
        originalRequest.headers.Authorization = `Bearer ${data.token}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        resolvePendingRequests(null)
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
