import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCategories } from '../api/categories'

const DISMISS_KEY = 'osiris-onboarding-dismissed'
const CELEBRATED_KEY = 'osiris-onboarding-celebrated'

const STEPS = [
  {
    key: 'categories',
    icon: '🏷️',
    title: 'Criar suas categorias',
    description: 'Separe receitas e despesas do seu jeito — ex: Alimentação, Salário, Transporte.',
    time: '~2 min',
    to: '/categories',
    cta: 'Criar categoria',
  },
  {
    key: 'accounts',
    icon: '💳',
    title: 'Cadastrar uma conta',
    description: 'Carteira, conta corrente ou poupança — pra saber onde o dinheiro está.',
    time: '~1 min',
    to: '/accounts',
    cta: 'Cadastrar conta',
  },
  {
    key: 'transaction',
    icon: '🧾',
    title: 'Registrar seu primeiro lançamento',
    description: 'Uma receita ou despesa real — é o que faz o painel ganhar vida.',
    time: '~1 min',
    to: '/transactions',
    cta: 'Adicionar lançamento',
  },
]

function ProgressRing({ doneCount, total }) {
  const size = 56
  const stroke = 5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - doneCount / total)

  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="fill-none stroke-indigo-100 dark:stroke-indigo-950"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="fill-none stroke-indigo-500 transition-all duration-500 dark:stroke-indigo-400"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-indigo-700 dark:text-indigo-300">
        {doneCount}/{total}
      </span>
    </div>
  )
}

/**
 * "transactionsCount" vem de summary.recent_transactions (até 8, só do mês
 * selecionado no Dashboard) — não é uma contagem exata de todas as
 * transações do usuário, mas é suficiente aqui: quem já tem qualquer
 * lançamento em qualquer mês recente não é mais um usuário de primeiro
 * acesso, que é o único caso que este checklist precisa cobrir.
 */
export default function OnboardingChecklist({ accountsCount, transactionsCount }) {
  const [categoriesCount, setCategoriesCount] = useState(null)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    listCategories().then((categories) => setCategoriesCount(categories.length))
  }, [])

  const doneMap = {
    categories: (categoriesCount ?? 0) > 0,
    accounts: accountsCount > 0,
    transaction: transactionsCount > 0,
  }
  const doneCount = Object.values(doneMap).filter(Boolean).length
  const allDone = categoriesCount !== null && doneCount === STEPS.length

  // Celebra uma única vez quando o 3º passo é concluído (marcado no
  // localStorage pra não repetir em recarregamentos futuros), depois some.
  useEffect(() => {
    if (!allDone || localStorage.getItem(CELEBRATED_KEY) === '1') return

    localStorage.setItem(CELEBRATED_KEY, '1')
    setShowCelebration(true)
    const timer = setTimeout(() => setShowCelebration(false), 4000)
    return () => clearTimeout(timer)
  }, [allDone])

  if (categoriesCount === null) return null
  if (allDone && !showCelebration) return null

  if (showCelebration) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <span className="text-2xl">🎉</span>
        <div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Tudo pronto!</p>
          <p className="text-xs text-emerald-700/80 dark:text-emerald-400/70">
            Seu painel Osiris está configurado e pronto pra uso.
          </p>
        </div>
      </div>
    )
  }

  function collapse() {
    localStorage.setItem(DISMISS_KEY, '1')
    setCollapsed(true)
  }

  function expand() {
    localStorage.removeItem(DISMISS_KEY)
    setCollapsed(false)
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={expand}
        className="flex w-full items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-2.5 text-left text-sm transition-colors hover:bg-indigo-50 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40"
      >
        <span className="font-medium text-indigo-700 dark:text-indigo-300">👋 Continuar configuração do Osiris</span>
        <span className="text-xs text-indigo-500 dark:text-indigo-400">
          {doneCount}/{STEPS.length} concluído · continuar
        </span>
      </button>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm dark:border-indigo-900/40 dark:bg-neutral-900">
      <div className="flex items-start gap-4 border-b border-indigo-50 bg-indigo-50/50 p-5 dark:border-indigo-950/40 dark:bg-indigo-950/20">
        <ProgressRing doneCount={doneCount} total={STEPS.length} />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100">Bem-vindo(a) ao Osiris! 👋</h2>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-neutral-400">
            Faltam {STEPS.length - doneCount} passo{STEPS.length - doneCount === 1 ? '' : 's'} rápido
            {STEPS.length - doneCount === 1 ? '' : 's'} pra você ver o painel funcionando de verdade.
          </p>
        </div>
        <button
          type="button"
          onClick={collapse}
          className="shrink-0 text-xs text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300"
        >
          Ocultar
        </button>
      </div>

      <ul className="divide-y divide-slate-100 dark:divide-neutral-800">
        {STEPS.map((step) => {
          const done = doneMap[step.key]

          return (
            <li key={step.key}>
              {done ? (
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm text-white">
                    ✓
                  </span>
                  <p className="text-sm font-medium text-slate-400 line-through dark:text-neutral-600">{step.title}</p>
                </div>
              ) : (
                <Link
                  to={step.to}
                  className="group flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50 sm:flex-nowrap dark:hover:bg-neutral-800/60"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base dark:bg-indigo-950/60">
                    {step.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-neutral-100">{step.title}</p>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">{step.description}</p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs text-slate-400 dark:text-neutral-500">
                    {step.time}
                  </span>
                  <span className="shrink-0 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition-colors group-hover:bg-indigo-600">
                    {step.cta}
                  </span>
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
