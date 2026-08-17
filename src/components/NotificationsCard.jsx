import { useEffect, useState } from 'react'
import { removeSubscription, saveSubscription } from '../api/pushSubscriptions'
import { urlBase64ToUint8Array } from '../utils/webPush'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window

export default function NotificationsCard() {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(isSupported)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isSupported) return

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then(setSubscription)
      .finally(() => setLoading(false))
  }, [])

  async function handleEnable() {
    setError(null)
    setWorking(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setError('Permissão de notificação negada. Você pode habilitar depois nas configurações do navegador.')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      await saveSubscription(newSubscription.toJSON())
      setSubscription(newSubscription)
    } catch {
      setError('Não foi possível ativar as notificações. Tente novamente.')
    } finally {
      setWorking(false)
    }
  }

  async function handleDisable() {
    setError(null)
    setWorking(true)
    try {
      const endpoint = subscription.endpoint
      await subscription.unsubscribe()
      await removeSubscription(endpoint)
      setSubscription(null)
    } catch {
      setError('Não foi possível desativar as notificações. Tente novamente.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
      <h2 className="text-sm font-medium text-slate-700 dark:text-neutral-300">Notificações</h2>

      {!isSupported ? (
        <p className="text-sm text-slate-400 dark:text-neutral-500">
          Seu navegador não suporta notificações push.
        </p>
      ) : loading ? (
        <p className="text-sm text-slate-400 dark:text-neutral-500">Verificando...</p>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-700 dark:text-neutral-300">Avisar quando um limite de gastos estourar</p>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Envia uma notificação push assim que um lançamento faz algum limite atingir 100%.
            </p>
          </div>
          <button
            type="button"
            onClick={subscription ? handleDisable : handleEnable}
            disabled={working}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              subscription
                ? 'border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800'
                : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white'
            }`}
          >
            {working ? '...' : subscription ? 'Desativar' : 'Ativar notificações'}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
