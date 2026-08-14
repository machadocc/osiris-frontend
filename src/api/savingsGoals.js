import api from './client'

export function listSavingsGoals() {
  return api.get('/savings-goals').then((response) => response.data.data)
}

export function createSavingsGoal(data) {
  return api.post('/savings-goals', data).then((response) => response.data.data)
}

export function updateSavingsGoal(id, data) {
  return api.put(`/savings-goals/${id}`, data).then((response) => response.data.data)
}

export function deleteSavingsGoal(id) {
  return api.delete(`/savings-goals/${id}`)
}
