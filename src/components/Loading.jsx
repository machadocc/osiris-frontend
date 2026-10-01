import Spinner from './Spinner.jsx'

export default function Loading({ label = 'Carregando...', className = '' }) {
  return (
    <div
      className={`flex items-center justify-center gap-2 py-10 text-sm text-slate-500 dark:text-neutral-400 ${className}`}
    >
      <Spinner />
      {label}
    </div>
  )
}
