import api from './client'

export function listTransactions(params = {}) {
  return api.get('/transactions', { params }).then((response) => response.data)
}

export function createTransaction(data) {
  return api.post('/transactions', data).then((response) => response.data.data)
}

export function updateTransaction(id, data) {
  return api.put(`/transactions/${id}`, data).then((response) => response.data.data)
}

export function deleteTransaction(id) {
  return api.delete(`/transactions/${id}`)
}
