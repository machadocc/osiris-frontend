import { useEffect, useState } from 'react'
import { createCategory, deleteCategory, listCategories } from '../api/categories'
import CategoryBadge from '../components/CategoryBadge.jsx'

const emptyForm = { name: '', type: 'expense', color: '#64748b' }

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    listCategories()
      .then(setCategories)
      .finally(() => setLoading(false))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    await createCategory(form)
    setForm(emptyForm)
    load()
  }

  async function handleDelete(id) {
    await deleteCategory(id)
    load()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Categorias</h1>

      <form
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-4 dark:bg-slate-900"
      >
        <input
          type="text"
          required
          placeholder="Nome"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />

        <select
          value={form.type}
          onChange={(event) => setForm({ ...form, type: event.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="income">Receita</option>
          <option value="expense">Despesa</option>
        </select>

        <input
          type="color"
          value={form.color}
          onChange={(event) => setForm({ ...form, color: event.target.value })}
          className="h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700"
        />

        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          Adicionar
        </button>
      </form>

      <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Carregando...</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center justify-between py-3 text-sm">
                <CategoryBadge category={category} />
                <button
                  onClick={() => handleDelete(category.id)}
                  className="text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
                >
                  Remover
                </button>
              </li>
            ))}
            {categories.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">Nenhuma categoria cadastrada.</p>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
