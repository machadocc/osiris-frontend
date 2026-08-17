import api from './client'

export function getDashboardSummary(params = {}) {
  return api.get('/dashboard/summary', { params }).then((response) => response.data)
}

export function compareMonths(monthA, monthB) {
  return api.get('/dashboard/compare', { params: { month_a: monthA, month_b: monthB } }).then((response) => response.data)
}
