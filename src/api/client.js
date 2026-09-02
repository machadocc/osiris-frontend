import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      const retryAfter = Number(error.response.headers?.['retry-after']) || 60
      window.dispatchEvent(new CustomEvent('osiris:rate-limited', { detail: { retryAfter } }))
    }

    return Promise.reject(error)
  },
)

export default api
