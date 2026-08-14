import { useEffect, useMemo, useState } from 'react'
import { listAccounts } from '../api/accounts'
import { listCategories } from '../api/categories'
import { createTransaction, deleteTransaction, listTransactions } from '../api/transactions'
import CategoryBadge from '../components/CategoryBadge.jsx'
import ReceiptInput from '../components/ReceiptInput.jsx'

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const emptyForm = {
  category_id: '',
  account_id: '',
  amount: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  receipt: null,
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [viewingReceipt, setViewingReceipt] = useState(null)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    Promise.all([listTransactions(), listCategories(), listAccounts()])
      .then(([transactionsResponse, categoriesResponse, accountsResponse]) => {
        setTransactions(transactionsResponse.data)
        setCategories(categoriesResponse)
        setAccounts(accountsResponse)
      })
      .finally(() => setLoading(false))
  }

  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === String(form.category_id)),
    [categories, form.category_id],
  )

  function handleReceiptExtracted(data) {
    setForm((current) => ({
      ...current,
      amount: data.amount ?? current.amount,
      date: data.date ?? current.date,
      description: data.description ?? current.description,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    await createTransaction({
      ...form,
      account_id: form.account_id || null,
      amount: Number(form.amount),
    })
    setForm(emptyForm)
    load()
  }

  async function handleDelete(id) {
    await deleteTransaction(id)
    load()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Transações</h1>

      <form
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-6 dark:bg-slate-900"
      >
        <div className="flex items-center gap-2 sm:col-span-2">
          <select
            required
            value={form.category_id}
            onChange={(event) => setForm({ ...form, category_id: event.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">Categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {selectedCategory && (
            <span
              className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                selectedCategory.type === 'income'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
              }`}
            >
              {selectedCategory.type === 'income' ? 'Receita' : 'Despesa'}
            </span>
          )}
        </div>

        <select
          value={form.account_id}
          onChange={(event) => setForm({ ...form, account_id: event.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">Sem conta</option>
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
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />

        <input
          type="text"
          placeholder="Descrição"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />

        <input
          type="date"
          required
          value={form.date}
          onChange={(event) => setForm({ ...form, date: event.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />

        <ReceiptInput
          file={form.receipt}
          onFileChange={(receipt) => setForm((current) => ({ ...current, receipt }))}
          onExtracted={handleReceiptExtracted}
        />

        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 sm:col-span-6 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          Adicionar
        </button>
      </form>

      <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Carregando...</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((transaction) => (
              <li key={transaction.id} className="flex items-center justify-between py-3 text-sm">
                <div className="flex items-center gap-3">
                  {transaction.receipt_url && (
                    <button type="button" onClick={() => setViewingReceipt(transaction.receipt_url)}>
                      <img
                        src={transaction.receipt_url}
                        alt="Comprovante"
                        className="h-10 w-10 rounded object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                    </button>
                  )}
                  <CategoryBadge category={transaction.category} />
                  {transaction.account && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">{transaction.account.name}</span>
                  )}
                  <span className="text-slate-600 dark:text-slate-300">{transaction.description || '-'}</span>
                  <span className="text-slate-400 dark:text-slate-500">{transaction.date}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={
                      transaction.category.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }
                  >
                    {transaction.category.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </span>
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
            {transactions.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">Nenhuma transação cadastrada.</p>
            )}
          </ul>
        )}
      </div>

      {viewingReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setViewingReceipt(null)}
        >
          <img src={viewingReceipt} alt="Comprovante ampliado" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  )
}
