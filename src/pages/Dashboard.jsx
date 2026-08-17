import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardSummary } from '../api/dashboard'
import CategoryBadge from '../components/CategoryBadge.jsx'
import OnboardingChecklist from '../components/OnboardingChecklist.jsx'

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

function BalanceHistoryChart({ history, forecast }) {
  const width = 600
  const height = 140
  const padding = 20

  const data = [...history, ...forecast]
  const boundaryIndex = history.length - 1

  const values = data.map((point) => point.balance)
  const max = Math.max(...values, 0)
  const min = Math.min(...values, 0)
  const range = max - min || 1

  const points = data.map((point, index) => ({
    x: padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1),
    y: height - padding - ((point.balance - min) / range) * (height - padding * 2),
    ...point,
  }))

  const historyPoints = points.slice(0, boundaryIndex + 1)
  const forecastPoints = points.slice(boundaryIndex)

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
            className="stroke-slate-200 dark:stroke-neutral-700"
          />
        )}
        <polyline
          points={historyPoints.map((point) => `${point.x},${point.y}`).join(' ')}
          fill="none"
          strokeWidth="2"
          className="stroke-indigo-500 dark:stroke-indigo-400"
        />
        {forecastPoints.length > 1 && (
          <polyline
            points={forecastPoints.map((point) => `${point.x},${point.y}`).join(' ')}
            fill="none"
            strokeWidth="2"
            strokeDasharray="5 4"
            className="stroke-indigo-400 opacity-70 dark:stroke-indigo-500"
          />
        )}
        {historyPoints.map((point) => (
          <circle key={point.month} cx={point.x} cy={point.y} r="3" className="fill-indigo-500 dark:fill-indigo-400" />
        ))}
        {forecastPoints.slice(1).map((point) => (
          <circle
            key={point.month}
            cx={point.x}
            cy={point.y}
            r="3"
            strokeWidth="2"
            className="fill-white stroke-indigo-400 dark:fill-neutral-900 dark:stroke-indigo-500"
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-slate-400 dark:text-neutral-500">
        {data.map((point, index) => (
          <span key={point.month} className={index > boundaryIndex ? 'italic opacity-70' : ''}>
            {monthShortLabel(point.month)}
          </span>
        ))}
      </div>
      {forecastPoints.length > 1 && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 dark:text-neutral-500">
          <span className="inline-block h-px w-3 border-t-2 border-dashed border-indigo-400 dark:border-indigo-500" />
          Projeção com base em transações recorrentes detectadas
        </p>
      )}
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
    return <p className="text-slate-500 dark:text-neutral-400">Carregando...</p>
  }

  const totalAccountsBalance = summary.accounts.reduce((sum, account) => sum + account.balance, 0)

  const totalSavedInGoals = summary.savings_goals.reduce((sum, goal) => sum + goal.current_amount, 0)
  const totalGoalsTarget = summary.savings_goals.reduce((sum, goal) => sum + goal.target_amount, 0)
  const goalsOverallPercentage =
    totalGoalsTarget > 0 ? Math.min(Math.round((totalSavedInGoals / totalGoalsTarget) * 1000) / 10, 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-neutral-100">Painel financeiro</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonth(shiftMonth(month, -1))}
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            ←
          </button>
          <span className="w-36 text-center text-sm font-medium text-slate-700 dark:text-neutral-300">
            {monthLabel(month)}
          </span>
          <button
            onClick={() => setMonth(shiftMonth(month, 1))}
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            →
          </button>
        </div>
      </div>

      <OnboardingChecklist
        accountsCount={summary.accounts.length}
        transactionsCount={summary.recent_transactions.length}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-900">
          <p className="text-sm text-slate-500 dark:text-neutral-400">Receitas</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.totals.income)}
          </p>
          <div className="mt-1">
            <ComparisonBadge current={summary.totals.income} previous={summary.previous_totals.income} />
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-900">
          <p className="text-sm text-slate-500 dark:text-neutral-400">Despesas</p>
          <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(summary.totals.expense)}
          </p>
          <div className="mt-1">
            <ComparisonBadge current={summary.totals.expense} previous={summary.previous_totals.expense} positiveIsGood={false} />
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-900">
          <p className="text-sm text-slate-500 dark:text-neutral-400">Saldo do mês</p>
          <p
            className={`mt-1 text-2xl font-semibold ${
              summary.totals.balance >= 0 ? 'text-slate-900 dark:text-neutral-100' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatCurrency(summary.totals.balance)}
          </p>
          <div className="mt-1">
            <ComparisonBadge current={summary.totals.balance} previous={summary.previous_totals.balance} />
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-900">
          <p className="text-sm text-slate-500 dark:text-neutral-400">Saldo em contas</p>
          <p
            className={`mt-1 text-2xl font-semibold ${
              totalAccountsBalance >= 0 ? 'text-slate-900 dark:text-neutral-100' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatCurrency(totalAccountsBalance)}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-neutral-500">
            {totalSavedInGoals > 0
              ? `${formatCurrency(totalAccountsBalance - totalSavedInGoals)} livre · ${formatCurrency(totalSavedInGoals)} em metas`
              : 'Total acumulado, não só do mês'}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-900">
        <h2 className="mb-4 text-sm font-medium text-slate-700 dark:text-neutral-300">Evolução do saldo (6 meses + projeção)</h2>
        <BalanceHistoryChart history={summary.balance_history} forecast={summary.balance_forecast} />
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700 dark:text-neutral-300">Metas de economia</h2>
          <Link
            to="/savings-goals"
            className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            Ver todas
          </Link>
        </div>

        {summary.savings_goals.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-neutral-500">Nenhuma meta de economia cadastrada.</p>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-end justify-between">
                <p className="text-2xl font-semibold text-slate-900 dark:text-neutral-100">
                  {formatCurrency(totalSavedInGoals)}
                </p>
                <p className="text-sm text-slate-500 dark:text-neutral-400">de {formatCurrency(totalGoalsTarget)}</p>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
                <div
                  className={`h-full rounded-full ${goalsOverallPercentage >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                  style={{ width: `${goalsOverallPercentage}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-400 dark:text-neutral-500">
                {goalsOverallPercentage}% guardado no total, em {summary.savings_goals.length} meta(s)
              </p>
            </div>

            <ul className="space-y-3">
              {summary.savings_goals.map((goal) => (
                <li key={goal.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-neutral-300">{goal.name}</span>
                    <span className="text-slate-500 dark:text-neutral-400">
                      {formatCurrency(goal.current_amount)} · {goal.percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
                    <div
                      className={`h-full rounded-full ${goal.percentage >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      style={{ width: `${goal.percentage}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-900">
          <h2 className="mb-4 text-sm font-medium text-slate-700 dark:text-neutral-300">Gastos por categoria</h2>
          {summary.expenses_by_category.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-neutral-500">Nenhuma despesa neste mês.</p>
          ) : (
            <ul className="space-y-3">
              {summary.expenses_by_category.map((entry) => (
                <li key={entry.category.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-neutral-300">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.category.color }} />
                      {entry.category.name}
                    </span>
                    <span className="text-slate-500 dark:text-neutral-400">
                      {formatCurrency(entry.total)} · {entry.percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
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

        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700 dark:text-neutral-300">Limites de gastos</h2>
            <Link
              to="/spending-limits"
              className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              Ver todos
            </Link>
          </div>
          {summary.spending_limits.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-neutral-500">Nenhum limite definido para este mês.</p>
          ) : (
            <ul className="space-y-4">
              {summary.spending_limits.map((limit) => (
                <li key={limit.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-neutral-300">{limit.name}</span>
                    <span className="text-slate-500 dark:text-neutral-400">{limit.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
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
        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700 dark:text-neutral-300">Contas</h2>
            <Link
              to="/accounts"
              className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              Ver todas
            </Link>
          </div>
          {summary.accounts.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-neutral-500">Nenhuma conta cadastrada.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-neutral-800">
              {summary.accounts.map((account) => (
                <li key={account.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="text-slate-700 dark:text-neutral-300">{account.name}</p>
                    {account.institution && (
                      <p className="text-xs text-slate-400 dark:text-neutral-500">{account.institution}</p>
                    )}
                  </div>
                  <span className={account.balance >= 0 ? 'text-slate-900 dark:text-neutral-100' : 'text-red-600 dark:text-red-400'}>
                    {formatCurrency(account.balance)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700 dark:text-neutral-300">Últimos lançamentos</h2>
            <Link
              to="/transactions"
              className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              Ver todas
            </Link>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-neutral-800">
            {summary.recent_transactions.map((transaction) => (
              <li key={transaction.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={transaction.category} />
                  {transaction.account && (
                    <span className="text-xs text-slate-400 dark:text-neutral-500">{transaction.account.name}</span>
                  )}
                  <span className="text-slate-600 dark:text-neutral-300">{transaction.description || '-'}</span>
                </div>
                <span
                  className={`shrink-0 ${
                    transaction.category.type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {transaction.category.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                </span>
              </li>
            ))}
            {summary.recent_transactions.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400 dark:text-neutral-500">Nenhum lançamento registrado ainda.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
