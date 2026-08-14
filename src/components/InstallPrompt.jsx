import { useEffect, useState } from 'react'

const DISMISSED_KEY = 'pwa-install-dismissed'

export default function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault()

      if (localStorage.getItem(DISMISSED_KEY)) return

      setDeferredEvent(event)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  async function handleInstall() {
    if (!deferredEvent) return

    setVisible(false)
    await deferredEvent.prompt()
    setDeferredEvent(null)
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl dark:bg-slate-100 dark:text-slate-900">
      <span className="flex-1">Instale o Osiris no seu dispositivo para acesso rápido, mesmo offline.</span>
      <button
        type="button"
        onClick={handleInstall}
        className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        Instalar
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dispensar"
        className="shrink-0 text-white/70 hover:text-white dark:text-slate-900/60 dark:hover:text-slate-900"
      >
        ✕
      </button>
    </div>
  )
}
