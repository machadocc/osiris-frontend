import { useEffect, useState } from 'react'
import { createAccount, deleteAccount, listAccounts } from '../api/accounts'

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const emptyForm = { name: '', institution: '' }

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    listAccounts()
      .then(setAccounts)
      .finally(() => setLoading(false))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    await createAccount({ ...form, institution: form.institution || null })
    setForm(emptyForm)
    load()
  }

  async function handleDelete(id) {
    await deleteAccount(id)
    load()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Contas</h1>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-3">
        <input
          type="text"
          required
          placeholder="Nome da conta"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

        <input
          type="text"
          placeholder="Instituição financeira (opcional)"
          value={form.institution}
          onChange={(event) => setForm({ ...form, institution: event.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

        <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Adicionar
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        {loading && <p className="text-sm text-slate-500">Carregando...</p>}

        {!loading && accounts.length === 0 && <p className="text-sm text-slate-400">Nenhuma conta cadastrada.</p>}

        {accounts.map((account) => (
          <div key={account.id} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-900">{account.name}</p>
                {account.institution && <p className="text-xs text-slate-500">{account.institution}</p>}
              </div>
              <button onClick={() => handleDelete(account.id)} className="text-xs text-slate-400 hover:text-red-600">
                Remover
              </button>
            </div>

            <p className={`mt-3 text-lg font-semibold ${account.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
              {formatCurrency(account.balance)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
