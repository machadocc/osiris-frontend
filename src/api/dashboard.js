import api from './client'

export function getDashboardSummary(params = {}) {
  return api.get('/dashboard/summary', { params }).then((response) => response.data)
}
