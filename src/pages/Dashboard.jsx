import { useEffect, useState } from 'react'
import { listTransactions } from '../api/transactions'
import CategoryBadge from '../components/CategoryBadge.jsx'

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listTransactions({ month: currentMonth() })
      .then((response) => setTransactions(response.data))
      .finally(() => setLoading(false))
  }, [])

  const income = transactions.filter((t) => t.category.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const expense = transactions.filter((t) => t.category.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const balance = income - expense

  if (loading) {
    return <p className="text-slate-500">Carregando...</p>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Painel do mês</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Receitas</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">{formatCurrency(income)}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Despesas</p>
          <p className="mt-1 text-2xl font-semibold text-red-600">{formatCurrency(expense)}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Saldo</p>
          <p className={`mt-1 text-2xl font-semibold ${balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-slate-700">Últimos lançamentos</h2>
        <ul className="divide-y divide-slate-100">
          {transactions.slice(0, 8).map((transaction) => (
            <li key={transaction.id} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-3">
                <CategoryBadge category={transaction.category} />
                <span className="text-slate-600">{transaction.description || '-'}</span>
              </div>
              <span className={transaction.category.type === 'income' ? 'text-emerald-600' : 'text-red-600'}>
                {transaction.category.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
              </span>
            </li>
          ))}
          {transactions.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">Nenhum lançamento neste mês.</p>
          )}
        </ul>
      </div>
    </div>
  )
}
