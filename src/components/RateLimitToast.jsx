import { useEffect, useState } from 'react'

export default function RateLimitToast() {
  const [seconds, setSeconds] = useState(null)

  useEffect(() => {
    function handleRateLimited(event) {
      setSeconds(event.detail?.retryAfter ?? 60)
    }

    window.addEventListener('osiris:rate-limited', handleRateLimited)
    return () => window.removeEventListener('osiris:rate-limited', handleRateLimited)
  }, [])

  useEffect(() => {
    if (seconds === null) return undefined
    if (seconds <= 0) {
      setSeconds(null)
      return undefined
    }

    const timer = setTimeout(() => setSeconds(seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [seconds])

  if (seconds === null) return null

  return (
    <div className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-lg dark:bg-amber-600">
      Muitas requisições em pouco tempo — aguarde {seconds}s e tente de novo.
    </div>
  )
}
