import { useEffect, useState } from 'react'
import { createCategory, deleteCategory, listCategories, updateCategory } from '../api/categories'
import CategoryBadge from '../components/CategoryBadge.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Modal from '../components/Modal.jsx'

const emptyForm = { name: '', type: 'expense', color: '#64748b', keywords: '' }

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    listCategories()
      .then(setCategories)
      .finally(() => setLoading(false))
  }

  function openCreateForm() {
    setEditingCategory(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEditForm(category) {
    setEditingCategory(category)
    setForm({ name: category.name, type: category.type, color: category.color, keywords: category.keywords ?? '' })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingCategory(null)
    setForm(emptyForm)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (editingCategory) {
      await updateCategory(editingCategory.id, form)
    } else {
      await createCategory(form)
    }

    closeForm()
    load()
  }

  async function handleDelete() {
    await deleteCategory(deletingId)
    setDeletingId(null)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-neutral-100">Categorias</h1>
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
            {categories.map((category) => (
              <li key={category.id} className="flex items-center justify-between py-3 text-sm">
                <CategoryBadge category={category} />
                <div className="flex items-center gap-3 text-xs">
                  <button
                    onClick={() => openEditForm(category)}
                    className="text-slate-400 hover:text-slate-700 dark:text-neutral-500 dark:hover:text-neutral-200"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeletingId(category.id)}
                    className="text-slate-400 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400"
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
            {categories.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400 dark:text-neutral-500">Nenhuma categoria cadastrada.</p>
            )}
          </ul>
        )}
      </div>

      <Modal open={showForm} onClose={closeForm} title={editingCategory ? 'Editar categoria' : 'Nova categoria'}>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <input
            type="text"
            required
            placeholder="Nome"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />

          <select
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
          </select>

          <input
            type="color"
            value={form.color}
            onChange={(event) => setForm({ ...form, color: event.target.value })}
            className="h-10 w-full rounded-lg border border-slate-300 dark:border-neutral-700"
          />

          <div className="space-y-1">
            <label className="text-xs text-slate-500 dark:text-neutral-400">
              Palavras-chave (opcional) — usadas para categorizar automaticamente ao importar um extrato
            </label>
            <input
              type="text"
              placeholder="ex: ifood, restaurante, mercado"
              value={form.keywords}
              onChange={(event) => setForm({ ...form, keywords: event.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            {editingCategory ? 'Salvar' : 'Adicionar'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={deletingId !== null}
        title="Remover categoria"
        message="Isso também remove todas as transações registradas nessa categoria. Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  )
}
