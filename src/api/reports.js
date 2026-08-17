import api from './client'

export async function downloadMonthlyReport(month) {
  const response = await api.get('/reports/monthly', {
    params: { month },
    responseType: 'blob',
  })

  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `relatorio-osiris-${month}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
