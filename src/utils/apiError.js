export function errorMessage(error, fallback = 'Não foi possível concluir a operação. Tente novamente.') {
  if (!error.response) return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.'

  const { status, data } = error.response

  if (status === 429) return null
  if (status === 422 && data?.errors) return Object.values(data.errors).flat()[0]
  if (status >= 500) return 'O servidor está indisponível no momento. Tente novamente em instantes.'

  return data?.message || fallback
}
