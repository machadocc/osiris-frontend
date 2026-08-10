import api from './client'

export function listSpendingLimits(params = {}) {
  return api.get('/spending-limits', { params }).then((response) => response.data.data)
}

export function createSpendingLimit(data) {
  return api.post('/spending-limits', data).then((response) => response.data.data)
}

export function updateSpendingLimit(id, data) {
  return api.put(`/spending-limits/${id}`, data).then((response) => response.data.data)
}

export function deleteSpendingLimit(id) {
  return api.delete(`/spending-limits/${id}`)
}
