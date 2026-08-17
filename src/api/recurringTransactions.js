import api from './client'

export function listRecurringTransactions(params = {}) {
  return api.get('/recurring-transactions', { params }).then((response) => response.data.data)
}

export function createRecurringTransaction(data) {
  return api.post('/recurring-transactions', data).then((response) => response.data.data)
}

export function updateRecurringTransaction(id, data) {
  return api.put(`/recurring-transactions/${id}`, data).then((response) => response.data.data)
}

export function deleteRecurringTransaction(id) {
  return api.delete(`/recurring-transactions/${id}`)
}
