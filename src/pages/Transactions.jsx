import { useEffect, useMemo, useState } from 'react'
import { listAccounts } from '../api/accounts'
import { listCategories } from '../api/categories'
import { createTransaction, deleteTransaction, listTransactions, updateTransaction } from '../api/transactions'
import { listSpendingLimits } from '../api/spendingLimits'
import CategoryBadge from '../components/CategoryBadge.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import ImportStatementModal from '../components/ImportStatementModal.jsx'
import Modal from '../components/Modal.jsx'
import ReceiptInput from '../components/ReceiptInput.jsx'
import Spinner from '../components/Spinner.jsx'

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

const emptyForm = {
  category_id: '',
  account_id: '',
  amount: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  receipt: null,
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [spendingLimits, setSpendingLimits] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [viewingReceipt, setViewingReceipt] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [removeExistingReceipt, setRemoveExistingReceipt] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  const [descriptionSuggestion, setDescriptionSuggestion] = useState(null)

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => load(search), 350)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function load(searchTerm = search) {
    setLoading(true)
    Promise.all([
      listTransactions(searchTerm ? { search: searchTerm } : {}),
      listCategories(),
      listAccounts(),
      listSpendingLimits(),
    ])
      .then(([transactionsResponse, categoriesResponse, accountsResponse, spendingLimitsResponse]) => {
        setTransactions(transactionsResponse.data)
        setCategories(categoriesResponse)
        setAccounts(accountsResponse)
        setSpendingLimits(spendingLimitsResponse)
      })
      .finally(() => setLoading(false))
  }

  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === String(form.category_id)),
    [categories, form.category_id],
  )

  // Feature 1: warn when this transaction would push a spending limit past 80%.
  const limitAlerts = useMemo(() => {
    const amount = Number(form.amount)
    if (!form.category_id || !amount || !selectedCategory || selectedCategory.type !== 'expense') return []

    const transactionMonth = form.date.slice(0, 7)

    return spendingLimits
      .filter((limit) => limit.reference_month.slice(0, 7) === transactionMonth)
      .filter((limit) => !limit.category || String(limit.category.id) === String(selectedCategory.id))
      .map((limit) => {
        const projected = limit.spent_amount + amount
        const percentage = limit.limit_amount > 0 ? Math.round((projected / limit.limit_amount) * 100) : 0
        return { ...limit, projected, percentage }
      })
      .filter((limit) => limit.percentage >= 80)
  }, [form.category_id, form.amount, form.date, selectedCategory, spendingLimits])

  // Feature 6: suggest a category from past transactions with a similar description.
  useEffect(() => {
    if (form.category_id || form.description.trim().length < 3) {
      setDescriptionSuggestion(null)
      return
    }

    const timeout = setTimeout(() => {
      listTransactions({ search: form.description.trim() })
        .then((response) => {
          const match = response.data.find((transaction) => transaction.category)
          setDescriptionSuggestion(match ? match.category : null)
        })
        .catch(() => setDescriptionSuggestion(null))
    }, 400)

    return () => clearTimeout(timeout)
  }, [form.description, form.category_id])

  // Feature 5: warn when the OCR-read amount/date match an existing transaction.
  async function checkDuplicate(amount, date) {
    if (!amount || !date) {
      setDuplicateWarning(null)
      return
    }

    try {
      const response = await listTransactions({ month: date.slice(0, 7) })
      const match = response.data.find(
        (transaction) => transaction.date === date && Math.abs(transaction.amount - amount) < 0.01,
      )
      setDuplicateWarning(match ? { amount, date } : null)
    } catch {
      setDuplicateWarning(null)
    }
  }

  function handleReceiptExtracted(data) {
    setForm((current) => ({
      ...current,
      category_id: data.categoryId ?? current.category_id,
      amount: data.amount ?? current.amount,
      date: data.date ?? current.date,
      description: data.description ?? current.description,
    }))

    checkDuplicate(data.amount, data.date)
  }

  function applySuggestedCategory() {
    if (descriptionSuggestion) {
      setForm((current) => ({ ...current, category_id: descriptionSuggestion.id }))
    }
  }

  function openCreateForm() {
    setEditingTransaction(null)
    setRemoveExistingReceipt(false)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEditForm(transaction) {
    setEditingTransaction(transaction)
    setRemoveExistingReceipt(false)
    setForm({
      category_id: transaction.category.id,
      account_id: transaction.account?.id ?? '',
      amount: String(transaction.amount),
      description: transaction.description ?? '',
      date: transaction.date,
      receipt: null,
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingTransaction(null)
    setRemoveExistingReceipt(false)
    setForm(emptyForm)
    setDuplicateWarning(null)
    setDescriptionSuggestion(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        account_id: form.account_id || null,
        amount: Number(form.amount),
      }

      if (editingTransaction) {
        if (removeExistingReceipt && !form.receipt) payload.remove_receipt = 1
        await updateTransaction(editingTransaction.id, payload)
      } else {
        await createTransaction(payload)
      }

      closeForm()
      load()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    await deleteTransaction(deletingId)
    setDeletingId(null)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-neutral-100">Transações</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Importar extrato
          </button>
          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            + Adicionar
          </button>
        </div>
      </div>

      <input
        type="search"
        placeholder="Buscar por descrição..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />

      <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-neutral-900">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-neutral-400">Carregando...</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-neutral-800">
            {transactions.map((transaction) => (
              <li key={transaction.id} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {transaction.receipt_url && (
                    <button type="button" onClick={() => setViewingReceipt(transaction.receipt_url)}>
                      <img
                        src={transaction.receipt_url}
                        alt="Comprovante"
                        className="h-10 w-10 rounded object-cover ring-1 ring-slate-200 dark:ring-neutral-700"
                      />
                    </button>
                  )}
                  <CategoryBadge category={transaction.category} />
                  {transaction.is_recurring && (
                    <span
                      title="Parece uma transação recorrente"
                      className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                    >
                      🔁 recorrente
                    </span>
                  )}
                  {transaction.is_unusual_amount && (
                    <span
                      title="Valor bem acima do que é comum para essa categoria"
                      className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                    >
                      ⚠️ fora do padrão
                    </span>
                  )}
                  {transaction.account && (
                    <span className="text-xs text-slate-400 dark:text-neutral-500">{transaction.account.name}</span>
                  )}
                  <span className="text-slate-600 dark:text-neutral-300">{transaction.description || '-'}</span>
                  <span className="text-slate-400 dark:text-neutral-500">{formatDate(transaction.date)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span
                    className={
                      transaction.category.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }
                  >
                    {transaction.category.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => openEditForm(transaction)}
                      className="text-slate-400 hover:text-slate-700 dark:text-neutral-500 dark:hover:text-neutral-200"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeletingId(transaction.id)}
                      className="text-slate-400 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {transactions.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400 dark:text-neutral-500">
                {search ? 'Nenhuma transação encontrada.' : 'Nenhuma transação cadastrada.'}
              </p>
            )}
          </ul>
        )}
      </div>

      <Modal open={showForm} onClose={closeForm} title={editingTransaction ? 'Editar transação' : 'Nova transação'}>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 sm:col-span-2">
            <select
              required
              value={form.category_id}
              onChange={(event) => setForm({ ...form, category_id: event.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <option value="">Categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {selectedCategory && (
              <span
                className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                  selectedCategory.type === 'income'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                }`}
              >
                {selectedCategory.type === 'income' ? 'Receita' : 'Despesa'}
              </span>
            )}
          </div>

          <select
            value={form.account_id}
            onChange={(event) => setForm({ ...form, account_id: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="">Sem conta</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="Valor"
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />

          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Descrição"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
            {descriptionSuggestion && (
              <button
                type="button"
                onClick={applySuggestedCategory}
                className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
              >
                💡 Usar categoria "{descriptionSuggestion.name}" (baseado em lançamentos anteriores)
              </button>
            )}
          </div>

          <input
            type="date"
            required
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />

          {limitAlerts.length > 0 && (
            <div className="space-y-1.5 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 sm:col-span-2 dark:bg-amber-500/10 dark:text-amber-400">
              {limitAlerts.map((limit) => (
                <p key={limit.id}>
                  ⚠️ Isso deixa "{limit.name}" em {limit.percentage}% do limite (
                  {formatCurrency(limit.projected)} de {formatCurrency(limit.limit_amount)}).
                </p>
              ))}
            </div>
          )}

          {duplicateWarning && (
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700 sm:col-span-2 dark:bg-amber-500/10 dark:text-amber-400">
              ⚠️ Já existe uma transação de {formatCurrency(duplicateWarning.amount)} em{' '}
              {formatDate(duplicateWarning.date)} — confira se você não está lançando o mesmo cupom duas vezes.
            </p>
          )}

          <ReceiptInput
            file={form.receipt}
            categories={categories}
            existingUrl={removeExistingReceipt ? null : editingTransaction?.receipt_url ?? null}
            onRemoveExisting={() => setRemoveExistingReceipt(true)}
            onFileChange={(receipt) => setForm((current) => ({ ...current, receipt }))}
            onExtracted={handleReceiptExtracted}
          />

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            {submitting && <Spinner />}
            {submitting ? 'Salvando...' : editingTransaction ? 'Salvar' : 'Adicionar'}
          </button>
        </form>
      </Modal>

      <Modal open={Boolean(viewingReceipt)} onClose={() => setViewingReceipt(null)} title="Comprovante">
        <img src={viewingReceipt} alt="Comprovante ampliado" className="max-h-[70vh] w-full rounded-lg object-contain" />
      </Modal>

      <ConfirmDialog
        open={deletingId !== null}
        title="Remover transação"
        message="Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />

      <ImportStatementModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        categories={categories}
        onCategoriesCreated={(created) => setCategories((current) => [...current, ...created])}
        accounts={accounts}
        onImported={load}
      />
    </div>
  )
}
