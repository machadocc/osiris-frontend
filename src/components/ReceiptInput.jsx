import { useEffect, useRef, useState } from 'react'
import { extractReceiptData } from '../utils/receiptOcr.js'

export default function ReceiptInput({ file, onFileChange, onExtracted }) {
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
      const data = await extractReceiptData(file, setProgress)
      onExtracted(data)
      setStatus(data.amount || data.date || data.description ? 'done' : 'not-found')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="space-y-2 sm:col-span-6">
      <label className="text-sm text-slate-600 dark:text-slate-400">Comprovante (opcional)</label>

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Anexar foto do cupom
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          <img src={previewUrl} alt="Prévia do comprovante" className="h-16 w-16 rounded object-cover" />

          <div className="flex flex-1 flex-col gap-2 text-sm">
            {status === 'choosing' && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  Preencher automaticamente
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('attached')}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Apenas anexar
                </button>
              </div>
            )}

            {status === 'reading' && (
              <div className="space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">Lendo comprovante... {progress}%</p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-slate-900 dark:bg-slate-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {status === 'done' && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Campos preenchidos a partir do comprovante — confira antes de salvar.
              </p>
            )}
            {status === 'not-found' && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Não consegui identificar os dados automaticamente. Preencha manualmente.
              </p>
            )}
            {status === 'error' && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Não foi possível ler a imagem. Preencha manualmente.
              </p>
            )}
            {status === 'attached' && (
              <p className="text-xs text-slate-500 dark:text-slate-400">Imagem anexada.</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
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
