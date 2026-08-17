import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCategories } from '../api/categories'

const DISMISS_KEY = 'osiris-onboarding-dismissed'

/**
 * "transactionsCount" vem de summary.recent_transactions (até 8, só do mês
 * selecionado no Dashboard) — não é uma contagem exata de todas as
 * transações do usuário, mas é suficiente aqui: quem já tem qualquer
 * lançamento em qualquer mês recente não é mais um usuário de primeiro
 * acesso, que é o único caso que este checklist precisa cobrir.
 */
export default function OnboardingChecklist({ accountsCount, transactionsCount }) {
  const [categoriesCount, setCategoriesCount] = useState(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')

  useEffect(() => {
    listCategories().then((categories) => setCategoriesCount(categories.length))
  }, [])

  if (dismissed || categoriesCount === null) return null

  const steps = [
    { label: 'Criar categorias de receita e despesa', done: categoriesCount > 0, to: '/categories' },
    { label: 'Cadastrar uma conta (carteira, banco...)', done: accountsCount > 0, to: '/accounts' },
    { label: 'Registrar seu primeiro lançamento', done: transactionsCount > 0, to: '/transactions' },
  ]

  if (steps.every((step) => step.done)) return null

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  const doneCount = steps.filter((step) => step.done).length

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5 dark:border-indigo-900/40 dark:bg-indigo-950/30">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">Primeiros passos no Osiris</h2>
          <p className="text-xs text-indigo-700/80 dark:text-indigo-300/70">
            {doneCount} de {steps.length} concluídos
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-200"
        >
          Dispensar
        </button>
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-3 text-sm">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                step.done
                  ? 'bg-emerald-500 text-white'
                  : 'border border-indigo-300 text-indigo-400 dark:border-indigo-700'
              }`}
            >
              {step.done ? '✓' : ''}
            </span>
            {step.done ? (
              <span className="text-indigo-900/50 line-through dark:text-indigo-300/40">{step.label}</span>
            ) : (
              <Link to={step.to} className="font-medium text-indigo-700 hover:underline dark:text-indigo-300">
                {step.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
