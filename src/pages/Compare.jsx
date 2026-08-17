import { useEffect, useState } from 'react'
import { compareMonths } from '../api/dashboard'

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function previousMonth() {
  const date = new Date()
  date.setDate(1)
  date.setMonth(date.getMonth() - 1)
  return date.toISOString().slice(0, 7)
}

function monthLabel(monthStr) {
  const [year, month] = monthStr.split('-')
  const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export default function Compare() {
  const [monthA, setMonthA] = useState(currentMonth())
  const [monthB, setMonthB] = useState(previousMonth())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    compareMonths(monthA, monthB)
      .then(setData)
      .finally(() => setLoading(false))
  }, [monthA, monthB])

  const categoryRows = (() => {
    if (!data) return []
    const totalsByName = new Map()

    for (const entry of data.month_a.expenses_by_category) {
      totalsByName.set(entry.category.name, { category: entry.category, a: entry.total, b: 0 })
    }
    for (const entry of data.month_b.expenses_by_category) {
      const existing = totalsByName.get(entry.category.name)
      if (existing) {
        existing.b = entry.total
      } else {
        totalsByName.set(entry.category.name, { category: entry.category, a: 0, b: entry.total })
      }
    }

    return Array.from(totalsByName.values()).sort((x, y) => y.a + y.b - (x.a + x.b))
  })()

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-neutral-100">Comparar meses</h1>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-300">
          Mês A
          <input
            type="month"
            value={monthA}
            onChange={(event) => setMonthA(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-300">
          Mês B
          <input
            type="month"
            value={monthB}
            onChange={(event) => setMonthB(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>
      </div>

      {loading && <p className="text-sm text-slate-500 dark:text-neutral-400">Carregando...</p>}

      {!loading && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: monthLabel(monthA), totals: data.month_a.totals },
              { label: monthLabel(monthB), totals: data.month_b.totals },
            ].map((entry) => (
              <div key={entry.label} className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-900">
                <p className="mb-3 text-sm font-medium text-slate-900 dark:text-neutral-100">{entry.label}</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-400 dark:text-neutral-500">Receita</p>
                    <p className="text-emerald-600 dark:text-emerald-400">{formatCurrency(entry.totals.income)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-neutral-500">Despesa</p>
                    <p className="text-red-600 dark:text-red-400">{formatCurrency(entry.totals.expense)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-neutral-500">Saldo</p>
                    <p className="text-slate-900 dark:text-neutral-100">{formatCurrency(entry.totals.balance)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-900">
            <p className="mb-3 text-sm font-medium text-slate-900 dark:text-neutral-100">Gastos por categoria</p>
            {categoryRows.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-neutral-500">Nenhuma despesa em nenhum dos dois meses.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 dark:text-neutral-500">
                      <th className="pb-2 pr-4 font-medium">Categoria</th>
                      <th className="pb-2 pr-4 font-medium">{monthLabel(monthA)}</th>
                      <th className="pb-2 pr-4 font-medium">{monthLabel(monthB)}</th>
                      <th className="pb-2 font-medium">Diferença</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                    {categoryRows.map((row) => {
                      const diff = row.a - row.b
                      return (
                        <tr key={row.category.name}>
                          <td className="py-2 pr-4 text-slate-700 dark:text-neutral-200">{row.category.name}</td>
                          <td className="py-2 pr-4 text-slate-600 dark:text-neutral-300">{formatCurrency(row.a)}</td>
                          <td className="py-2 pr-4 text-slate-600 dark:text-neutral-300">{formatCurrency(row.b)}</td>
                          <td className={diff > 0 ? 'py-2 text-red-600 dark:text-red-400' : diff < 0 ? 'py-2 text-emerald-600 dark:text-emerald-400' : 'py-2 text-slate-400 dark:text-neutral-500'}>
                            {diff === 0 ? '—' : `${diff > 0 ? '+' : ''}${formatCurrency(diff)}`}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
