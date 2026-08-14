import { useEffect, useState } from 'react'
import { createAccount, deleteAccount, listAccounts } from '../api/accounts'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Modal from '../components/Modal.jsx'

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const emptyForm = { name: '', institution: '' }

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    listAccounts()
      .then(setAccounts)
      .finally(() => setLoading(false))
  }

  function closeForm() {
    setShowForm(false)
    setForm(emptyForm)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    await createAccount({ ...form, institution: form.institution || null })
    closeForm()
    load()
  }

  async function handleDelete() {
    await deleteAccount(deletingId)
    setDeletingId(null)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Contas</h1>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          + Adicionar
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Carregando...</p>}

        {!loading && accounts.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500">Nenhuma conta cadastrada.</p>
        )}

        {accounts.map((account) => (
          <div key={account.id} className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{account.name}</p>
                {account.institution && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{account.institution}</p>
                )}
              </div>
              <button
                onClick={() => setDeletingId(account.id)}
                className="text-xs text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
              >
                Remover
              </button>
            </div>

            <p
              className={`mt-3 text-lg font-semibold ${
                account.balance >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatCurrency(account.balance)}
            </p>
          </div>
        ))}
      </div>

      <Modal open={showForm} onClose={closeForm} title="Nova conta">
        <form onSubmit={handleSubmit} className="grid gap-3">
          <input
            type="text"
            required
            placeholder="Nome da conta"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />

          <input
            type="text"
            placeholder="Instituição financeira (opcional)"
            value={form.institution}
            onChange={(event) => setForm({ ...form, institution: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />

          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Adicionar
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={deletingId !== null}
        title="Remover conta"
        message="As transações associadas a essa conta não serão apagadas — apenas ficarão sem conta vinculada."
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  )
}
