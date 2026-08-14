import { useEffect, useRef, useState } from 'react'
import { extractReceiptData } from '../utils/receiptOcr.js'

export default function ReceiptInput({ file, onFileChange, onExtracted, categories = [] }) {
  const inputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function handleSelect(event) {
    const selected = event.target.files[0]
    if (!selected) return

    onFileChange(selected)
    setPreviewUrl(URL.createObjectURL(selected))
    setStatus('choosing')
  }

  function handleRemove() {
    onFileChange(null)
    setPreviewUrl(null)
    setStatus('idle')
    setProgress(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleAutoFill() {
    setStatus('reading')
    setProgress(0)

    try {
      const data = await extractReceiptData(file, categories, setProgress)
      onExtracted(data)

      if (!data.amount && !data.date && !data.description) {
        setStatus('not-found')
      } else {
        setStatus(data.categoryId ? 'done-with-category' : 'done')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <label className="text-sm text-slate-600 dark:text-slate-400">Comprovante (opcional)</label>

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-4 text-center transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        >
          <span className="text-xl">📷</span>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Anexar foto do cupom</span>
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            ✨ Preenchemos valor, data e categoria pra você
          </span>
        </button>
      ) : (
        <div className="flex flex-wrap items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
          <img
            src={previewUrl}
            alt="Prévia do comprovante"
            className="h-16 w-16 rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
          />

          <div className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
            {status === 'choosing' && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-indigo-500"
                >
                  ✨ Preencher automaticamente
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('attached')}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Apenas anexar
                </button>
              </div>
            )}

            {status === 'reading' && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Lendo comprovante... {progress}%
                </p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-[width] duration-200 dark:bg-indigo-400"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {status === 'done-with-category' && (
              <p className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                ✅ Campos e categoria preenchidos — confira antes de salvar
              </p>
            )}
            {status === 'done' && (
              <p className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                ✅ Campos preenchidos — escolha a categoria manualmente
              </p>
            )}
            {status === 'not-found' && (
              <p className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                ⚠️ Não identifiquei os dados. Preencha manualmente.
              </p>
            )}
            {status === 'error' && (
              <p className="inline-flex w-fit items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
                ✕ Não foi possível ler a imagem.
              </p>
            )}
            {status === 'attached' && (
              <p className="inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                📎 Imagem anexada
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="text-xs font-medium text-slate-400 transition-colors hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
          >
            Remover
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleSelect}
        className="hidden"
      />
    </div>
  )
}
