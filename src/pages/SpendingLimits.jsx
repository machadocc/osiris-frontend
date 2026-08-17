import { useEffect, useState } from 'react'
import { listCategories } from '../api/categories'
import {
  createSpendingLimit,
  deleteSpendingLimit,
  listSpendingLimits,
  updateSpendingLimit,
} from '../api/spendingLimits'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Modal from '../components/Modal.jsx'
import Spinner from '../components/Spinner.jsx'

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

const emptyForm = { category_id: '', name: '', limit_amount: '', reference_month: `${currentMonth()}-01` }

export default function SpendingLimits() {
  const [spendingLimits, setSpendingLimits] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLimit, setEditingLimit] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    Promise.all([listSpendingLimits(), listCategories()])
      .then(([spendingLimitsData, categoriesData]) => {
        setSpendingLimits(spendingLimitsData)
        setCategories(categoriesData)
      })
      .finally(() => setLoading(false))
  }

  function openCreateForm() {
    setEditingLimit(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEditForm(spendingLimit) {
    setEditingLimit(spendingLimit)
    setForm({
      category_id: spendingLimit.category?.id ?? '',
      name: spendingLimit.name,
      limit_amount: String(spendingLimit.limit_amount),
      reference_month: spendingLimit.reference_month,
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingLimit(null)
    setForm(emptyForm)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        category_id: form.category_id || null,
        limit_amount: Number(form.limit_amount),
      }

      if (editingLimit) {
        await updateSpendingLimit(editingLimit.id, payload)
      } else {
        await createSpendingLimit(payload)
      }

      closeForm()
      load()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    await deleteSpendingLimit(deletingId)
    setDeletingId(null)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-neutral-100">Limites de gastos</h1>
        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          + Adicionar
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {loading && <p className="text-sm text-slate-500 dark:text-neutral-400">Carregando...</p>}

        {!loading && spendingLimits.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-neutral-500">Nenhum limite de gasto cadastrado.</p>
        )}

        {spendingLimits.map((spendingLimit) => (
          <div key={spendingLimit.id} className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-neutral-100">{spendingLimit.name}</p>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  {spendingLimit.category?.name ?? 'Todas as categorias'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs">
                <button
                  onClick={() => openEditForm(spendingLimit)}
                  className="text-slate-400 hover:text-slate-700 dark:text-neutral-500 dark:hover:text-neutral-200"
                >
                  Editar
                </button>
                <button
                  onClick={() => setDeletingId(spendingLimit.id)}
                  className="text-slate-400 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400"
                >
                  Remover
                </button>
              </div>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
              <div
                className={`h-full rounded-full ${spendingLimit.percentage >= 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${spendingLimit.percentage}%` }}
              />
            </div>

            <div className="mt-2 flex justify-between text-xs text-slate-500 dark:text-neutral-400">
              <span>
                {formatCurrency(spendingLimit.spent_amount)} de {formatCurrency(spendingLimit.limit_amount)}
              </span>
              <span>{spendingLimit.percentage}%</span>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showForm} onClose={closeForm} title={editingLimit ? 'Editar limite de gastos' : 'Novo limite de gastos'}>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <input
            type="text"
            required
            placeholder="Nome do limite"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />

          <select
            value={form.category_id}
            onChange={(event) => setForm({ ...form, category_id: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="Valor limite"
            value={form.limit_amount}
            onChange={(event) => setForm({ ...form, limit_amount: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />

          <input
            type="month"
            required
            value={form.reference_month.slice(0, 7)}
            onChange={(event) => setForm({ ...form, reference_month: `${event.target.value}-01` })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            {submitting && <Spinner />}
            {submitting ? 'Salvando...' : editingLimit ? 'Salvar' : 'Adicionar'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={deletingId !== null}
        title="Remover limite de gastos"
        message="Isso não afeta as transações — só remove o acompanhamento desse limite."
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  )
}
