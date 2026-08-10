import api from './client'

export function listBudgets(params = {}) {
  return api.get('/budgets', { params }).then((response) => response.data.data)
}

export function createBudget(data) {
  return api.post('/budgets', data).then((response) => response.data.data)
}

export function updateBudget(id, data) {
  return api.put(`/budgets/${id}`, data).then((response) => response.data.data)
}

export function deleteBudget(id) {
  return api.delete(`/budgets/${id}`)
}
