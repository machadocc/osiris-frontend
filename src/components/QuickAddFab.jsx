import { useEffect, useState } from 'react'
import { listAccounts } from '../api/accounts'
import { listCategories } from '../api/categories'
import { createTransaction } from '../api/transactions'
import { parseQuickAdd } from '../utils/quickAddParser.js'
import CategoryOptionGroups from './CategoryOptionGroups.jsx'
import CategoryTypeTag from './CategoryTypeTag.jsx'
import Modal from './Modal.jsx'
import Spinner from './Spinner.jsx'

function PlusIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function QuickAddFab() {
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || categories.length > 0) return
    Promise.all([listCategories(), listAccounts()]).then(([categoriesResponse, accountsResponse]) => {
      setCategories(categoriesResponse)
      setAccounts(accountsResponse)
    })
  }, [open, categories.length])

  function handleClose() {
    setOpen(false)
    setText('')
    setParsed(null)
  }

  function handleParse(event) {
    event.preventDefault()
    if (!text.trim()) return

    const result = parseQuickAdd(text)
    setParsed({
      amount: result.amount !== null ? String(result.amount) : '',
      date: result.date,
      description: result.description,
      category_id: '',
      account_id: '',
    })
  }

  async function handleConfirm(event) {
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
      handleClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Modal open={open} onClose={handleClose} title="Nova transação rápida">
        {!parsed ? (
          <form onSubmit={handleParse} className="space-y-3">
            <input
              type="text"
              autoFocus
              placeholder='"50 mercado hoje"'
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
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
          <form onSubmit={handleConfirm} className="space-y-3">
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="Valor"
              value={parsed.amount}
              onChange={(event) => setParsed({ ...parsed, amount: event.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <input
              type="date"
              required
              value={parsed.date}
              onChange={(event) => setParsed({ ...parsed, date: event.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <input
              type="text"
              placeholder="Descrição"
              value={parsed.description}
              onChange={(event) => setParsed({ ...parsed, description: event.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <div className="flex items-center gap-2">
              <select
                required
                value={parsed.category_id}
                onChange={(event) => setParsed({ ...parsed, category_id: event.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              >
                <option value="" disabled className="text-slate-400 dark:text-neutral-500">
                  Selecione a categoria
                </option>
                <CategoryOptionGroups categories={categories} />
              </select>
              <CategoryTypeTag
                type={categories.find((category) => String(category.id) === String(parsed.category_id))?.type}
              />
            </div>
            <select
              required
              value={parsed.account_id}
              onChange={(event) => setParsed({ ...parsed, account_id: event.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <option value="" disabled className="text-slate-400 dark:text-neutral-500">
                Selecione a conta
              </option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
              >
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
          onClick={() => setOpen(true)}
          aria-label="Adicionar transação rápida"
          title="Adicionar transação rápida"
          className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-transform hover:scale-105 hover:bg-slate-800 active:scale-95 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      )}
    </>
  )
}
