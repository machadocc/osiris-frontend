import { useEffect, useMemo, useState } from 'react'
import {
  createSavingsGoal,
  deleteSavingsGoal,
  listSavingsGoals,
  updateSavingsGoal,
} from '../api/savingsGoals'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Modal from '../components/Modal.jsx'

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatEstimatedDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function daysUntil(dateStr) {
  const target = new Date(`${dateStr}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

const emptyForm = { name: '', target_amount: '', target_date: '' }
const emptyContribution = { amount: '' }

export default function SavingsGoals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [contributingGoal, setContributingGoal] = useState(null)
  const [contribution, setContribution] = useState(emptyContribution)

  useEffect(() => {
    load()
  }, [])

  const totalCurrent = useMemo(() => goals.reduce((sum, goal) => sum + goal.current_amount, 0), [goals])
  const totalTarget = useMemo(() => goals.reduce((sum, goal) => sum + goal.target_amount, 0), [goals])
  const overallPercentage =
    totalTarget > 0 ? Math.min(Math.round((totalCurrent / totalTarget) * 1000) / 10, 100) : 0

  function load() {
    setLoading(true)
    listSavingsGoals()
      .then(setGoals)
      .finally(() => setLoading(false))
  }

  function openCreateForm() {
    setEditingGoal(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEditForm(goal) {
    setEditingGoal(goal)
    setForm({
      name: goal.name,
      target_amount: String(goal.target_amount),
      target_date: goal.target_date ?? '',
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingGoal(null)
    setForm(emptyForm)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const payload = {
      name: form.name,
      target_amount: Number(form.target_amount),
      target_date: form.target_date || null,
    }

    if (editingGoal) {
      await updateSavingsGoal(editingGoal.id, payload)
    } else {
      await createSavingsGoal(payload)
    }

    closeForm()
    load()
  }

  async function handleDelete() {
    await deleteSavingsGoal(deletingId)
    setDeletingId(null)
    load()
  }

  async function handleContribute(event) {
    event.preventDefault()
    const amount = Number(contribution.amount)
    if (!amount) return

    await updateSavingsGoal(contributingGoal.id, {
      current_amount: contributingGoal.current_amount + amount,
    })

    setContributingGoal(null)
    setContribution(emptyContribution)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-neutral-100">Metas de economia</h1>
        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          + Adicionar
        </button>
      </div>

      {!loading && goals.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-900">
          <p className="text-sm text-slate-500 dark:text-neutral-400">Total guardado em metas</p>
          <div className="mt-1 flex items-end justify-between">
            <p className="text-2xl font-semibold text-slate-900 dark:text-neutral-100">{formatCurrency(totalCurrent)}</p>
            <p className="text-sm text-slate-500 dark:text-neutral-400">de {formatCurrency(totalTarget)}</p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
            <div
              className={`h-full rounded-full ${overallPercentage >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400 dark:text-neutral-500">
            {overallPercentage}% da soma de todas as metas · {goals.length} meta(s)
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {loading && <p className="text-sm text-slate-500 dark:text-neutral-400">Carregando...</p>}

        {!loading && goals.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-neutral-500">Nenhuma meta de economia cadastrada.</p>
        )}

        {goals.map((goal) => {
          const remainingDays = goal.target_date ? daysUntil(goal.target_date) : null

          return (
            <div key={goal.id} className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-900">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-neutral-100">{goal.name}</p>
                  {goal.target_date && (
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      {remainingDays >= 0
                        ? `${remainingDays} dia(s) até ${goal.target_date}`
                        : `Prazo vencido em ${goal.target_date}`}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <button
                    onClick={() => openEditForm(goal)}
                    className="text-slate-400 hover:text-slate-700 dark:text-neutral-500 dark:hover:text-neutral-200"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeletingId(goal.id)}
                    className="text-slate-400 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400"
                  >
                    Remover
                  </button>
                </div>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
                <div
                  className={`h-full rounded-full ${goal.percentage >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                  style={{ width: `${goal.percentage}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
                <span>
                  {formatCurrency(goal.current_amount)} de {formatCurrency(goal.target_amount)}
                </span>
                <span>{goal.percentage}%</span>
              </div>

              {goal.estimated_completion_date && (
                <p className="mt-1 text-xs text-slate-400 dark:text-neutral-500">
                  No ritmo atual, previsão de conclusão: {formatEstimatedDate(goal.estimated_completion_date)}
                </p>
              )}

              <button
                type="button"
                onClick={() => setContributingGoal(goal)}
                className="mt-3 w-full rounded-lg border border-dashed border-slate-300 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                + Contribuir
              </button>
            </div>
          )
        })}
      </div>

      <Modal open={showForm} onClose={closeForm} title={editingGoal ? 'Editar meta' : 'Nova meta de economia'}>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <input
            type="text"
            required
            placeholder="Nome da meta"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />

          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="Valor alvo"
            value={form.target_amount}
            onChange={(event) => setForm({ ...form, target_amount: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />

          <div className="space-y-1">
            <label className="text-xs text-slate-500 dark:text-neutral-400">Data alvo (opcional)</label>
            <input
              type="date"
              value={form.target_date}
              onChange={(event) => setForm({ ...form, target_date: event.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            {editingGoal ? 'Salvar' : 'Adicionar'}
          </button>
        </form>
      </Modal>

      <Modal
        open={contributingGoal !== null}
        onClose={() => setContributingGoal(null)}
        title={`Contribuir para "${contributingGoal?.name ?? ''}"`}
      >
        <form onSubmit={handleContribute} className="grid gap-3">
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            autoFocus
            placeholder="Valor a adicionar"
            value={contribution.amount}
            onChange={(event) => setContribution({ amount: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            Adicionar
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={deletingId !== null}
        title="Remover meta"
        message="Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  )
}
