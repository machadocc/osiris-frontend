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

function monthShortLabel(monthStr) {
  const [year, month] = monthStr.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
}

function BalanceHistoryChart({ data }) {
  const width = 600
  const height = 140
  const padding = 20

  const values = data.map((point) => point.balance)
  const max = Math.max(...values, 0)
  const min = Math.min(...values, 0)
  const range = max - min || 1

  const points = data.map((point, index) => ({
    x: padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1),
    y: height - padding - ((point.balance - min) / range) * (height - padding * 2),
    ...point,
  }))

  const zeroY = height - padding - ((0 - min) / range) * (height - padding * 2)

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[140px] w-full" preserveAspectRatio="none">
        {min < 0 && max > 0 && (
          <line
            x1={padding}
            y1={zeroY}
            x2={width - padding}
            y2={zeroY}
            strokeDasharray="4 4"
            className="stroke-slate-200 dark:stroke-slate-700"
          />
        )}
        <polyline
          points={points.map((point) => `${point.x},${point.y}`).join(' ')}
          fill="none"
          strokeWidth="2"
          className="stroke-indigo-500 dark:stroke-indigo-400"
        />
        {points.map((point) => (
          <circle key={point.month} cx={point.x} cy={point.y} r="3" className="fill-indigo-500 dark:fill-indigo-400" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-slate-400 dark:text-slate-500">
        {data.map((point) => (
          <span key={point.month}>{monthShortLabel(point.month)}</span>
        ))}
      </div>
    </div>
  )
}

function ComparisonBadge({ current, previous, positiveIsGood = true }) {
  const change = percentChange(current, previous)
  if (change === null) return null

  const isPositive = change >= 0
  const isGood = positiveIsGood ? isPositive : !isPositive

  return (
    <span
      className={`text-xs font-medium ${
        isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
      }`}
    >
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
    return <p className="text-slate-500 dark:text-slate-400">Carregando...</p>
  }

  const totalAccountsBalance = summary.accounts.reduce((sum, account) => sum + account.balance, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Painel financeiro</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonth(shiftMonth(month, -1))}
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            ←
          </button>
          <span className="w-36 text-center text-sm font-medium text-slate-700 dark:text-slate-300">
            {monthLabel(month)}
          </span>
          <button
            onClick={() => setMonth(shiftMonth(month, 1))}
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Receitas</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.totals.income)}
          </p>
          <div className="mt-1">
            <ComparisonBadge current={summary.totals.income} previous={summary.previous_totals.income} />
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Despesas</p>
          <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(summary.totals.expense)}
          </p>
          <div className="mt-1">
            <ComparisonBadge current={summary.totals.expense} previous={summary.previous_totals.expense} positiveIsGood={false} />
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Saldo do mês</p>
          <p
            className={`mt-1 text-2xl font-semibold ${
              summary.totals.balance >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatCurrency(summary.totals.balance)}
          </p>
          <div className="mt-1">
            <ComparisonBadge current={summary.totals.balance} previous={summary.previous_totals.balance} />
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Saldo em contas</p>
          <p
            className={`mt-1 text-2xl font-semibold ${
              totalAccountsBalance >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatCurrency(totalAccountsBalance)}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Total acumulado, não só do mês</p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">Evolução do saldo (6 meses)</h2>
        <BalanceHistoryChart data={summary.balance_history} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">Gastos por categoria</h2>
          {summary.expenses_by_category.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">Nenhuma despesa neste mês.</p>
          ) : (
            <ul className="space-y-3">
              {summary.expenses_by_category.map((entry) => (
                <li key={entry.category.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.category.color }} />
                      {entry.category.name}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {formatCurrency(entry.total)} · {entry.percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
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

        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">Limites de gastos</h2>
            <Link
              to="/spending-limits"
              className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Ver todos
            </Link>
          </div>
          {summary.spending_limits.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">Nenhum limite definido para este mês.</p>
          ) : (
            <ul className="space-y-4">
              {summary.spending_limits.map((limit) => (
                <li key={limit.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300">{limit.name}</span>
                    <span className="text-slate-500 dark:text-slate-400">{limit.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
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
        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">Contas</h2>
            <Link
              to="/accounts"
              className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Ver todas
            </Link>
          </div>
          {summary.accounts.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">Nenhuma conta cadastrada.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {summary.accounts.map((account) => (
                <li key={account.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="text-slate-700 dark:text-slate-300">{account.name}</p>
                    {account.institution && (
                      <p className="text-xs text-slate-400 dark:text-slate-500">{account.institution}</p>
                    )}
                  </div>
                  <span className={account.balance >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-600 dark:text-red-400'}>
                    {formatCurrency(account.balance)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">Últimos lançamentos</h2>
            <Link
              to="/transactions"
              className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Ver todas
            </Link>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {summary.recent_transactions.map((transaction) => (
              <li key={transaction.id} className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-2">
                  <CategoryBadge category={transaction.category} />
                  {transaction.account && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">{transaction.account.name}</span>
                  )}
                  <span className="text-slate-600 dark:text-slate-300">{transaction.description || '-'}</span>
                </div>
                <span
                  className={
                    transaction.category.type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }
                >
                  {transaction.category.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                </span>
              </li>
            ))}
            {summary.recent_transactions.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">Nenhum lançamento registrado ainda.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
