import { useEffect, useState } from 'react'
import { listAccounts } from '../api/accounts'
import { listCategories } from '../api/categories'
import { listSavingsGoals, updateSavingsGoal } from '../api/savingsGoals'
import { createTransaction } from '../api/transactions'
import { useToast } from '../context/ToastContext.jsx'
import { errorMessage } from '../utils/apiError.js'
import { parseQuickAdd } from '../utils/quickAddParser.js'
import CurrencyInput from './CurrencyInput.jsx'
import Modal from './Modal.jsx'
import Spinner from './Spinner.jsx'

const TYPES = [
  { value: 'expense', label: 'Despesa' },
  { value: 'income', label: 'Receita' },
  { value: 'goal', label: 'Meta' },
]

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100'

const primaryButtonClass =
  'flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white'

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function PlusIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function placeholderFor(loaded, items, singular, loadedLabel) {
  if (!loaded) return `Carregando ${singular}...`
  if (items.length === 0) return `Nenhuma ${singular.slice(0, -1)} cadastrada`
  return loadedLabel
}

export default function QuickAddFab() {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('expense')
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [goals, setGoals] = useState([])
  const [loaded, setLoaded] = useState({ categories: false, accounts: false, goals: false })
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState(null)
  const [goalForm, setGoalForm] = useState({ goal_id: '', amount: '' })
  const [submitting, setSubmitting] = useState(false)

  function markLoaded(key) {
    setLoaded((current) => ({ ...current, [key]: true }))
  }

  function loadLists() {
    listCategories().then(setCategories).catch(() => {}).finally(() => markLoaded('categories'))
    listAccounts().then(setAccounts).catch(() => {}).finally(() => markLoaded('accounts'))
    listSavingsGoals().then(setGoals).catch(() => {}).finally(() => markLoaded('goals'))
  }

  useEffect(() => {
    loadLists()
  }, [])

  function handleOpen() {
    loadLists()
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
    setType('expense')
    setText('')
    setParsed(null)
    setGoalForm({ goal_id: '', amount: '' })
  }

  function changeType(nextType) {
    setType(nextType)
    setParsed((current) => (current ? { ...current, category_id: '' } : current))
  }

  function handleParse(event) {
    event.preventDefault()

    if (!text.trim()) {
      toast.error('Digite o valor e a descrição, por exemplo: "50 mercado hoje".')
      return
    }

    const result = parseQuickAdd(text)
    setParsed({
      amount: result.amount !== null ? String(result.amount) : '',
      date: result.date,
      description: result.description,
      category_id: '',
      account_id: '',
    })
  }

  async function handleConfirmTransaction(event) {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    try {
      await createTransaction({
        category_id: parsed.category_id,
        account_id: parsed.account_id,
        amount: Number(parsed.amount),
        date: parsed.date,
        description: parsed.description,
      })
      window.dispatchEvent(new Event('osiris:transaction-created'))
      toast.success(`${type === 'income' ? 'Receita' : 'Despesa'} de ${formatCurrency(Number(parsed.amount))} registrada.`)
      handleClose()
    } catch (error) {
      toast.error(errorMessage(error, 'Não foi possível registrar a transação.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmGoal(event) {
    event.preventDefault()
    if (submitting) return

    const goal = goals.find((item) => String(item.id) === String(goalForm.goal_id))
    const amount = Number(goalForm.amount)

    setSubmitting(true)
    try {
      await updateSavingsGoal(goal.id, { current_amount: goal.current_amount + amount })
      window.dispatchEvent(new Event('osiris:goal-updated'))
      toast.success(`${formatCurrency(amount)} adicionados à meta "${goal.name}".`)
      handleClose()
    } catch (error) {
      toast.error(errorMessage(error, 'Não foi possível registrar a contribuição.'))
    } finally {
      setSubmitting(false)
    }
  }

  const categoryOptions = categories.filter((category) => category.type === type)

  return (
    <>
      <Modal open={open} onClose={handleClose} title="Novo lançamento rápido">
        <div role="group" aria-label="Tipo de lançamento" className="mb-4 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-neutral-800">
          {TYPES.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={type === option.value}
              onClick={() => changeType(option.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                type === option.value
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
                  : 'text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {type === 'goal' ? (
          <form onSubmit={handleConfirmGoal} className="space-y-3">
            <select
              required
              value={goalForm.goal_id}
              onChange={(event) => setGoalForm({ ...goalForm, goal_id: event.target.value })}
              disabled={!loaded.goals}
              className={inputClass}
            >
              <option value="" disabled className="text-slate-400 dark:text-neutral-500">
                {placeholderFor(loaded.goals, goals, 'metas', 'Selecione a meta')}
              </option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
            </select>
            <CurrencyInput
              required
              autoFocus
              placeholder="Valor da contribuição (R$ 0,00)"
              value={goalForm.amount}
              onChange={(value) => setGoalForm({ ...goalForm, amount: value })}
              className={inputClass}
            />
            <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-full`}>
              {submitting && <Spinner />}
              {submitting ? 'Salvando...' : 'Contribuir'}
            </button>
          </form>
        ) : !parsed ? (
          <form onSubmit={handleParse} className="space-y-3">
            <input
              type="text"
              required
              autoFocus
              placeholder='"50 mercado hoje"'
              value={text}
              onChange={(event) => setText(event.target.value)}
              className={inputClass}
            />
            <p className="text-xs text-slate-400 dark:text-neutral-500">
              Valor, descrição e opcionalmente uma data (hoje, ontem, 17/08).
            </p>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
            >
              Continuar
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmTransaction} className="space-y-3">
            <CurrencyInput
              required
              placeholder="Valor (R$ 0,00)"
              value={parsed.amount}
              onChange={(value) => setParsed({ ...parsed, amount: value })}
              className={inputClass}
            />
            <input
              type="date"
              required
              value={parsed.date}
              onChange={(event) => setParsed({ ...parsed, date: event.target.value })}
              className={inputClass}
            />
            <input
              type="text"
              placeholder="Descrição"
              value={parsed.description}
              onChange={(event) => setParsed({ ...parsed, description: event.target.value })}
              className={inputClass}
            />
            <select
              required
              value={parsed.category_id}
              onChange={(event) => setParsed({ ...parsed, category_id: event.target.value })}
              disabled={!loaded.categories}
              className={inputClass}
            >
              <option value="" disabled className="text-slate-400 dark:text-neutral-500">
                {loaded.categories && categoryOptions.length === 0
                  ? `Nenhuma categoria de ${type === 'income' ? 'receita' : 'despesa'}`
                  : placeholderFor(loaded.categories, categoryOptions, 'categorias', 'Selecione a categoria')}
              </option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              required
              value={parsed.account_id}
              onChange={(event) => setParsed({ ...parsed, account_id: event.target.value })}
              disabled={!loaded.accounts}
              className={inputClass}
            >
              <option value="" disabled className="text-slate-400 dark:text-neutral-500">
                {placeholderFor(loaded.accounts, accounts, 'contas', 'Selecione a conta')}
              </option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={submitting} className={primaryButtonClass}>
                {submitting && <Spinner />}
                {submitting ? 'Salvando...' : 'Confirmar'}
              </button>
              <button
                type="button"
                onClick={() => setParsed(null)}
                className="text-sm text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                Voltar
              </button>
            </div>
          </form>
        )}
      </Modal>

      {!open && (
        <button
          type="button"
          onClick={handleOpen}
          aria-label="Novo lançamento rápido"
          className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 items-center justify-center gap-2 rounded-full bg-slate-900 px-5 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 hover:bg-slate-800 active:scale-95 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Lançamento rápido</span>
        </button>
      )}
    </>
  )
}
