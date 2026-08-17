import { useState } from 'react'
import { createCategory, listCategories } from '../api/categories'
import { createTransaction } from '../api/transactions'
import Modal from './Modal.jsx'

const FALLBACK_COLORS = { income: '#10b981', expense: '#ef4444' }

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function categoryLabel(category, categories) {
  const hasDuplicateName = categories.filter((other) => other.name === category.name).length > 1
  if (!hasDuplicateName) return category.name

  return `${category.name} (${category.type === 'income' ? 'Receita' : 'Despesa'})`
}

/**
 * Busca a lista de categorias direto da API (não usa a prop `categories` do
 * componente, que pode estar desatualizada se o usuário abrir o import antes
 * dela terminar de carregar) — evita criar "Outros" duplicado quando já
 * existe, só porque o estado local ainda não tinha sido preenchido.
 */
async function ensureFallbackCategories(onCategoriesCreated) {
  const freshCategories = await listCategories()

  const hasIncomeFallback = freshCategories.some((category) => category.name === 'Outros' && category.type === 'income')
  const hasExpenseFallback = freshCategories.some((category) => category.name === 'Outros' && category.type === 'expense')

  const created = []
  if (!hasIncomeFallback) {
    created.push(await createCategory({ name: 'Outros', type: 'income', color: FALLBACK_COLORS.income }))
  }
  if (!hasExpenseFallback) {
    created.push(await createCategory({ name: 'Outros', type: 'expense', color: FALLBACK_COLORS.expense }))
  }

  if (created.length > 0) onCategoriesCreated(created)

  return [...freshCategories, ...created]
}

export default function ImportStatementModal({ open, onClose, categories, onCategoriesCreated, accounts, onImported }) {
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(null)
  const [rows, setRows] = useState([])
  const [accountId, setAccountId] = useState('')
  const [error, setError] = useState(null)
  const [importedCount, setImportedCount] = useState(0)

  async function handleFileChange(event) {
    const file = event.target.files[0]
    event.target.value = ''
    if (!file) return

    setError(null)
    setStatus('reading')
    setProgress(null)

    try {
      const { extractStatementText, matchCategoryByKeywords, parseStatementLines } = await import(
        '../utils/statementParser'
      )
      const text = await extractStatementText(file, (p) => setProgress(p))
      const parsedLines = parseStatementLines(text)

      if (parsedLines.length === 0) {
        setError('Não consegui identificar nenhum lançamento nesse arquivo. Tente outro extrato.')
        setStatus('idle')
        return
      }

      const availableCategories = await ensureFallbackCategories(onCategoriesCreated)

      const draftRows = parsedLines.map((line, index) => {
        const matched = matchCategoryByKeywords(line.description, availableCategories)
        const fallbackType = line.amount >= 0 ? 'income' : 'expense'
        const fallback = availableCategories.find(
          (category) => category.name === 'Outros' && category.type === fallbackType,
        )
        const category = matched ?? fallback

        return {
          id: index,
          included: true,
          date: line.date,
          description: line.description ?? '',
          amount: Math.abs(line.amount),
          categoryId: category ? String(category.id) : '',
        }
      })

      setRows(draftRows)
      setStatus('review')
    } catch {
      setError('Não foi possível ler esse arquivo. Confira se é um PDF de extrato válido.')
      setStatus('idle')
    }
  }

  function toggleRow(id) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, included: !row.included } : row)))
  }

  function updateRow(id, changes) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...changes } : row)))
  }

  async function handleImport() {
    const toImport = rows.filter((row) => row.included && row.categoryId)
    setStatus('importing')
    setProgress({ page: 0, totalPages: toImport.length })

    for (let index = 0; index < toImport.length; index += 1) {
      const row = toImport[index]
      // eslint-disable-next-line no-await-in-loop
      await createTransaction({
        category_id: row.categoryId,
        account_id: accountId,
        amount: row.amount,
        description: row.description,
        date: row.date,
      })
      setProgress({ page: index + 1, totalPages: toImport.length })
    }

    setImportedCount(toImport.length)
    setStatus('done')
    onImported()
  }

  function handleClose() {
    setStatus('idle')
    setProgress(null)
    setRows([])
    setError(null)
    setAccountId('')
    onClose()
  }

  const includedCount = rows.filter((row) => row.included && row.categoryId).length

  return (
    <Modal open={open} onClose={handleClose} title="Importar extrato" size="lg">
      {status === 'idle' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-neutral-400">
            Envie o PDF do extrato do seu banco. O sistema tenta identificar data, valor e descrição de cada
            lançamento automaticamente — nada é criado antes de você revisar e confirmar.
          </p>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 hover:border-slate-400 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800">
            📄 Selecionar PDF do extrato
            <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      )}

      {status === 'reading' && (
        <div className="space-y-2 py-6 text-center text-sm text-slate-500 dark:text-neutral-400">
          <p>Lendo o extrato...</p>
          {progress && (
            <p className="text-xs text-slate-400 dark:text-neutral-500">
              Página {progress.page} de {progress.totalPages}
            </p>
          )}
        </div>
      )}

      {status === 'review' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600 dark:text-neutral-400">
              {rows.length} lançamento(s) encontrado(s). Confira categoria e valores antes de importar.
            </p>
            <select
              required
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <option value="">Selecione a conta</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-[45vh] overflow-x-auto overflow-y-auto rounded-lg border border-slate-200 dark:border-neutral-800">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500 dark:bg-neutral-800 dark:text-neutral-400">
                <tr>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Descrição</th>
                  <th className="px-3 py-2">Valor</th>
                  <th className="px-3 py-2">Categoria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {rows.map((row) => (
                  <tr key={row.id} className={row.included ? '' : 'opacity-40'}>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={row.included}
                        onChange={() => toggleRow(row.id)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600 dark:text-neutral-300">
                      {row.date.split('-').reverse().join('/')}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.description}
                        onChange={(event) => updateRow(row.id, { description: event.target.value })}
                        className="w-full min-w-[160px] rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-900 dark:text-neutral-100">
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.categoryId}
                        onChange={(event) => updateRow(row.id, { categoryId: event.target.value })}
                        className="w-full min-w-[140px] rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                      >
                        <option value="">Selecione</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {categoryLabel(category, categories)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={handleImport}
            disabled={includedCount === 0 || !accountId}
            className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            {accountId ? `Importar ${includedCount} transação(ões)` : 'Selecione uma conta pra importar'}
          </button>
        </div>
      )}

      {status === 'importing' && (
        <div className="space-y-2 py-6 text-center text-sm text-slate-500 dark:text-neutral-400">
          <p>Importando transações...</p>
          {progress && (
            <p className="text-xs text-slate-400 dark:text-neutral-500">
              {progress.page} de {progress.totalPages}
            </p>
          )}
        </div>
      )}

      {status === 'done' && (
        <div className="space-y-4 py-4 text-center">
          <p className="text-sm text-slate-700 dark:text-neutral-300">
            ✅ {importedCount} transação(ões) importada(s) com sucesso.
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            Fechar
          </button>
        </div>
      )}
    </Modal>
  )
}
