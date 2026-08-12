import api from './client'

export function register(data) {
  return api.post('/auth/register', data).then((response) => response.data)
}

export function login(data) {
  return api.post('/auth/login', data).then((response) => response.data)
}

export function logout() {
  return api.post('/auth/logout')
}

export function me() {
  return api.get('/auth/me').then((response) => response.data)
}

export function updateProfile(data) {
  return api.put('/auth/me', data).then((response) => response.data)
}

export function changePassword(data) {
  return api.put('/auth/me/password', data)
}
