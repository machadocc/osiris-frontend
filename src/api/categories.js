import api from './client'

export function listCategories() {
  return api.get('/categories').then((response) => response.data.data)
}

export function createCategory(data) {
  return api.post('/categories', data).then((response) => response.data.data)
}

export function updateCategory(id, data) {
  return api.put(`/categories/${id}`, data).then((response) => response.data.data)
}

export function deleteCategory(id) {
  return api.delete(`/categories/${id}`)
}
