import { useEffect, useState } from 'react'
import { listCategories } from '../api/categories'
import { createTransaction, deleteTransaction, listTransactions } from '../api/transactions'
import CategoryBadge from '../components/CategoryBadge.jsx'

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const emptyForm = {
  category_id: '',
  type: 'expense',
  amount: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    Promise.all([listTransactions(), listCategories()])
      .then(([transactionsResponse, categoriesResponse]) => {
        setTransactions(transactionsResponse.data)
        setCategories(categoriesResponse)
      })
      .finally(() => setLoading(false))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    await createTransaction({ ...form, amount: Number(form.amount) })
    setForm(emptyForm)
    load()
  }

  async function handleDelete(id) {
    await deleteTransaction(id)
    load()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Transações</h1>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-5">
        <select
          required
          value={form.category_id}
          onChange={(event) => setForm({ ...form, category_id: event.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={form.type}
          onChange={(event) => setForm({ ...form, type: event.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="income">Receita</option>
          <option value="expense">Despesa</option>
        </select>

        <input
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="Valor"
          value={form.amount}
          onChange={(event) => setForm({ ...form, amount: event.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

        <input
          type="text"
          placeholder="Descrição"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

        <input
          type="date"
          required
          value={form.date}
          onChange={(event) => setForm({ ...form, date: event.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 sm:col-span-5"
        >
          Adicionar
        </button>
      </form>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {transactions.map((transaction) => (
              <li key={transaction.id} className="flex items-center justify-between py-3 text-sm">
                <div className="flex items-center gap-3">
                  <CategoryBadge category={transaction.category} />
                  <span className="text-slate-600">{transaction.description || '-'}</span>
                  <span className="text-slate-400">{transaction.date}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'}>
                    {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </span>
                  <button onClick={() => handleDelete(transaction.id)} className="text-slate-400 hover:text-red-600">
                    Remover
                  </button>
                </div>
              </li>
            ))}
            {transactions.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">Nenhuma transação cadastrada.</p>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
