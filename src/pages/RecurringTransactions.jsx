import { useEffect, useState } from 'react'
import { listAccounts } from '../api/accounts'
import { listCategories } from '../api/categories'
import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  listRecurringTransactions,
  updateRecurringTransaction,
} from '../api/recurringTransactions'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Modal from '../components/Modal.jsx'
import Spinner from '../components/Spinner.jsx'

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const emptyForm = { category_id: '', account_id: '', amount: '', description: '', day_of_month: '5' }

export default function RecurringTransactions() {
  const [recurringTransactions, setRecurringTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    Promise.all([listRecurringTransactions(), listCategories(), listAccounts()])
      .then(([recurringData, categoriesData, accountsData]) => {
        setRecurringTransactions(recurringData)
        setCategories(categoriesData)
        setAccounts(accountsData)
      })
      .finally(() => setLoading(false))
  }

  function openCreateForm() {
    setEditingItem(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEditForm(item) {
    setEditingItem(item)
    setForm({
      category_id: item.category?.id ?? '',
      account_id: item.account?.id ?? '',
      amount: String(item.amount),
      description: item.description ?? '',
      day_of_month: String(item.day_of_month),
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingItem(null)
    setForm(emptyForm)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        account_id: form.account_id || null,
        amount: Number(form.amount),
        day_of_month: Number(form.day_of_month),
      }

      if (editingItem) {
        await updateRecurringTransaction(editingItem.id, payload)
      } else {
        await createRecurringTransaction(payload)
      }

      closeForm()
      load()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    await deleteRecurringTransaction(deletingId)
    setDeletingId(null)
    load()
  }

  async function toggleActive(item) {
    setTogglingId(item.id)
    try {
      await updateRecurringTransaction(item.id, { active: !item.active })
      load()
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-neutral-100">Lançamentos recorrentes</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
            Cadastre uma vez e o sistema lança automaticamente todo mês — ex: aluguel, assinaturas, salário.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          + Adicionar
        </button>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-900">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-neutral-400">Carregando...</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-neutral-800">
            {recurringTransactions.map((item) => (
              <li key={item.id} className={`flex flex-wrap items-center justify-between gap-3 py-3 text-sm ${item.active ? '' : 'opacity-50'}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`shrink-0 ${
                      item.category.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {item.category.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                  </span>
                  <span className="text-slate-600 dark:text-neutral-300">{item.description || item.category.name}</span>
                  <span className="text-xs text-slate-400 dark:text-neutral-500">todo dia {item.day_of_month}</span>
                  {item.account && (
                    <span className="text-xs text-slate-400 dark:text-neutral-500">{item.account.name}</span>
                  )}
                  {!item.active && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-neutral-800 dark:text-neutral-400">
                      pausada
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <button
                    onClick={() => toggleActive(item)}
                    disabled={togglingId === item.id}
                    className="text-slate-400 hover:text-slate-700 disabled:opacity-50 dark:text-neutral-500 dark:hover:text-neutral-200"
                  >
                    {item.active ? 'Pausar' : 'Retomar'}
                  </button>
                  <button
                    onClick={() => openEditForm(item)}
                    className="text-slate-400 hover:text-slate-700 dark:text-neutral-500 dark:hover:text-neutral-200"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeletingId(item.id)}
                    className="text-slate-400 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400"
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
            {recurringTransactions.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400 dark:text-neutral-500">
                Nenhum lançamento recorrente cadastrado.
              </p>
            )}
          </ul>
        )}
      </div>

      <Modal open={showForm} onClose={closeForm} title={editingItem ? 'Editar recorrência' : 'Nova recorrência'}>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <select
            required
            value={form.category_id}
            onChange={(event) => setForm({ ...form, category_id: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="">Categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            required
            value={form.account_id}
            onChange={(event) => setForm({ ...form, account_id: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="">Conta</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="Valor"
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />

          <input
            type="text"
            placeholder="Descrição (opcional)"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />

          <div className="space-y-1">
            <label className="text-xs text-slate-500 dark:text-neutral-400">Dia do mês (1 a 28)</label>
            <input
              type="number"
              min="1"
              max="28"
              required
              value={form.day_of_month}
              onChange={(event) => setForm({ ...form, day_of_month: event.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            {submitting && <Spinner />}
            {submitting ? 'Salvando...' : editingItem ? 'Salvar' : 'Adicionar'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={deletingId !== null}
        title="Remover recorrência"
        message="As transações já geradas não são apagadas — só a recorrência para de gerar novos lançamentos."
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  )
}
