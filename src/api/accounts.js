import api from './client'

export function listAccounts() {
  return api.get('/accounts').then((response) => response.data.data)
}

export function createAccount(data) {
  return api.post('/accounts', data).then((response) => response.data.data)
}

export function updateAccount(id, data) {
  return api.put(`/accounts/${id}`, data).then((response) => response.data.data)
}

export function deleteAccount(id) {
  return api.delete(`/accounts/${id}`)
}
