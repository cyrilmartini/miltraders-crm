import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ baseURL: API_URL })

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('mt_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 → redirect to login
api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mt_token')
      window.location.href = '/'
    }
    return Promise.reject(err.response?.data || err)
  }
)

export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
}

export const traders = {
  list: (params) => api.get('/traders', { params }),
  get: (id) => api.get(`/traders/${id}`),
  update: (id, data) => api.patch(`/traders/${id}`, data),
}

export const accounts = {
  list: (params) => api.get('/accounts', { params }),
  pendingReviews: () => api.get('/accounts/pending-reviews'),
  validate: (id, data) => api.post(`/accounts/${id}/validate`, data),
  refuse: (id, data) => api.post(`/accounts/${id}/refuse`, data),
  dismiss: (id, data) => api.post(`/accounts/${id}/dismiss`, data),
  sync: () => api.post('/accounts/sync'),
}

export const payouts = {
  pending: () => api.get('/payouts/pending'),
  history: () => api.get('/payouts/history'),
  stats: () => api.get('/payouts/stats'),
  approve: (id) => api.post(`/payouts/${id}/approve`),
  refuse: (id, data) => api.post(`/payouts/${id}/refuse`, data),
}

export default api
