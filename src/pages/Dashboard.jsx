import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardSummary } from '../api/dashboard'
import CategoryBadge from '../components/CategoryBadge.jsx'

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function shiftMonth(monthStr, delta) {
  const [year, month] = monthStr.split('-').map(Number)
  const date = new Date(year, month - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(monthStr) {
  const [year, month] = monthStr.split('-').map(Number)
  const label = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function percentChange(current, previous) {
  if (!previous) return null
  return ((current - previous) / previous) * 100
}

function ComparisonBadge({ current, previous, positiveIsGood = true }) {
  const change = percentChange(current, previous)
  if (change === null) return null

  const isPositive = change >= 0
  const isGood = positiveIsGood ? isPositive : !isPositive

  return (
    <span className={`text-xs font-medium ${isGood ? 'text-emerald-600' : 'text-red-500'}`}>
      {isPositive ? '+' : ''}
      {change.toFixed(1)}% vs mês anterior
    </span>
  )
}

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth())
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getDashboardSummary({ month })
      .then(setSummary)
      .finally(() => setLoading(false))
  }, [month])

  if (loading || !summary) {
    return <p className="text-slate-500">Carregando...</p>
  }

  const totalAccountsBalance = summary.accounts.reduce((sum, account) => sum + account.balance, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Painel financeiro</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonth(shiftMonth(month, -1))}
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            ←
          </button>
          <span className="w-36 text-center text-sm font-medium text-slate-700">{monthLabel(month)}</span>
          <button
            onClick={() => setMonth(shiftMonth(month, 1))}
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Receitas</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">{formatCurrency(summary.totals.income)}</p>
          <div className="mt-1">
            <ComparisonBadge current={summary.totals.income} previous={summary.previous_totals.income} />
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Despesas</p>
          <p className="mt-1 text-2xl font-semibold text-red-600">{formatCurrency(summary.totals.expense)}</p>
          <div className="mt-1">
            <ComparisonBadge current={summary.totals.expense} previous={summary.previous_totals.expense} positiveIsGood={false} />
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Saldo do mês</p>
          <p className={`mt-1 text-2xl font-semibold ${summary.totals.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
            {formatCurrency(summary.totals.balance)}
          </p>
          <div className="mt-1">
            <ComparisonBadge current={summary.totals.balance} previous={summary.previous_totals.balance} />
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Saldo em contas</p>
          <p className={`mt-1 text-2xl font-semibold ${totalAccountsBalance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
            {formatCurrency(totalAccountsBalance)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Total acumulado, não só do mês</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-medium text-slate-700">Gastos por categoria</h2>
          {summary.expenses_by_category.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma despesa neste mês.</p>
          ) : (
            <ul className="space-y-3">
              {summary.expenses_by_category.map((entry) => (
                <li key={entry.category.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-700">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.category.color }} />
                      {entry.category.name}
                    </span>
                    <span className="text-slate-500">
                      {formatCurrency(entry.total)} · {entry.percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${entry.percentage}%`, backgroundColor: entry.category.color }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700">Limites de gastos</h2>
            <Link to="/spending-limits" className="text-xs font-medium text-slate-500 hover:text-slate-700">
              Ver todos
            </Link>
          </div>
          {summary.spending_limits.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhum limite definido para este mês.</p>
          ) : (
            <ul className="space-y-4">
              {summary.spending_limits.map((limit) => (
                <li key={limit.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700">{limit.name}</span>
                    <span className="text-slate-500">{limit.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        limit.percentage >= 100 ? 'bg-red-500' : limit.percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${limit.percentage}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700">Contas</h2>
            <Link to="/accounts" className="text-xs font-medium text-slate-500 hover:text-slate-700">
              Ver todas
            </Link>
          </div>
          {summary.accounts.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma conta cadastrada.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {summary.accounts.map((account) => (
                <li key={account.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="text-slate-700">{account.name}</p>
                    {account.institution && <p className="text-xs text-slate-400">{account.institution}</p>}
                  </div>
                  <span className={account.balance >= 0 ? 'text-slate-900' : 'text-red-600'}>
                    {formatCurrency(account.balance)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700">Últimos lançamentos</h2>
            <Link to="/transactions" className="text-xs font-medium text-slate-500 hover:text-slate-700">
              Ver todas
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {summary.recent_transactions.map((transaction) => (
              <li key={transaction.id} className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-2">
                  <CategoryBadge category={transaction.category} />
                  {transaction.account && <span className="text-xs text-slate-400">{transaction.account.name}</span>}
                  <span className="text-slate-600">{transaction.description || '-'}</span>
                </div>
                <span className={transaction.category.type === 'income' ? 'text-emerald-600' : 'text-red-600'}>
                  {transaction.category.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                </span>
              </li>
            ))}
            {summary.recent_transactions.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">Nenhum lançamento registrado ainda.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
