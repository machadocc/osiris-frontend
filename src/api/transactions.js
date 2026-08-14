import api from './client'

function toFormData(data) {
  const formData = new FormData()

  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return
    formData.append(key, value)
  })

  return formData
}

export function listTransactions(params = {}) {
  return api.get('/transactions', { params }).then((response) => response.data)
}

export function createTransaction(data) {
  const payload = data.receipt instanceof File ? toFormData(data) : data

  return api.post('/transactions', payload).then((response) => response.data.data)
}

export function updateTransaction(id, data) {
  if (data.receipt instanceof File) {
    const payload = toFormData({ ...data, _method: 'PUT' })

    return api.post(`/transactions/${id}`, payload).then((response) => response.data.data)
  }

  return api.put(`/transactions/${id}`, data).then((response) => response.data.data)
}

export function deleteTransaction(id) {
  return api.delete(`/transactions/${id}`)
}
