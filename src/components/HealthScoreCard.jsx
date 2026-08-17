function ScoreRing({ score, ringClassName }) {
  const size = 88
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)

  return (
    <div className="relative h-[88px] w-[88px] shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="fill-none stroke-slate-100 dark:stroke-neutral-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`fill-none transition-all duration-500 ${ringClassName}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-900 dark:text-neutral-100">
        {score}
      </span>
    </div>
  )
}

const TIER_STYLES = {
  Excelente: { ring: 'stroke-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  Boa: { ring: 'stroke-indigo-500', text: 'text-indigo-600 dark:text-indigo-400' },
  Atenção: { ring: 'stroke-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  Crítica: { ring: 'stroke-red-500', text: 'text-red-600 dark:text-red-400' },
}

function componentScoreClass(score) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 40) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

/**
 * `healthScore` vem pronto do back-end (`/dashboard/summary`, campo
 * `health_score`) — null quando não há nenhum dado aplicável ainda (usuário
 * novo, sem limites/metas/lançamentos no mês). Cada componente do score já
 * traz sua própria explicação (`detail`), pra nunca mostrar um número sem
 * contexto do porquê.
 */
export default function HealthScoreCard({ healthScore }) {
  if (!healthScore) {
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-900">
        <h2 className="mb-1 text-sm font-medium text-slate-700 dark:text-neutral-300">Índice de saúde financeira</h2>
        <p className="text-sm text-slate-400 dark:text-neutral-500">
          Ainda não há dados suficientes este mês — cadastre um limite de gastos, uma meta de economia ou alguns
          lançamentos para calcular.
        </p>
      </div>
    )
  }

  const styles = TIER_STYLES[healthScore.label] ?? TIER_STYLES.Atenção

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-900">
      <h2 className="mb-4 text-sm font-medium text-slate-700 dark:text-neutral-300">Índice de saúde financeira</h2>

      <div className="flex items-center gap-4">
        <ScoreRing score={healthScore.score} ringClassName={styles.ring} />
        <div>
          <p className={`text-lg font-semibold ${styles.text}`}>{healthScore.label}</p>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Combina taxa de poupança, limites, metas e gastos atípicos do mês.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-neutral-800">
        {healthScore.components.map((component) => (
          <li key={component.key} className="flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <p className="text-slate-600 dark:text-neutral-300">{component.label}</p>
              <p className="truncate text-slate-400 dark:text-neutral-500">{component.detail}</p>
            </div>
            <span className={`shrink-0 font-semibold ${componentScoreClass(component.score)}`}>{component.score}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
