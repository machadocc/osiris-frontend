import { useEffect, useState } from 'react'
import { listCategories } from '../api/categories'
import { createSpendingLimit, deleteSpendingLimit, listSpendingLimits } from '../api/spendingLimits'

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

  async function handleSubmit(event) {
    event.preventDefault()
    await createSpendingLimit({
      ...form,
      category_id: form.category_id || null,
      limit_amount: Number(form.limit_amount),
    })
    setForm(emptyForm)
    load()
  }

  async function handleDelete(id) {
    await deleteSpendingLimit(id)
    load()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Limites de gastos</h1>

      <form
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-5 dark:bg-slate-900"
      >
        <input
          type="text"
          required
          placeholder="Nome do limite"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />

        <select
          value={form.category_id}
          onChange={(event) => setForm({ ...form, category_id: event.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />

        <input
          type="month"
          required
          value={form.reference_month.slice(0, 7)}
          onChange={(event) => setForm({ ...form, reference_month: `${event.target.value}-01` })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />

        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          Adicionar
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Carregando...</p>}

        {!loading && spendingLimits.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500">Nenhum limite de gasto cadastrado.</p>
        )}

        {spendingLimits.map((spendingLimit) => (
          <div key={spendingLimit.id} className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{spendingLimit.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {spendingLimit.category?.name ?? 'Todas as categorias'}
                </p>
              </div>
              <button
                onClick={() => handleDelete(spendingLimit.id)}
                className="text-xs text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
              >
                Remover
              </button>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full ${spendingLimit.percentage >= 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${spendingLimit.percentage}%` }}
              />
            </div>

            <div className="mt-2 flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                {formatCurrency(spendingLimit.spent_amount)} de {formatCurrency(spendingLimit.limit_amount)}
              </span>
              <span>{spendingLimit.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
