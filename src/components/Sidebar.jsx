import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from './Logo.jsx'

const links = [
  { to: '/', label: 'Painel' },
  { to: '/transactions', label: 'Transações' },
  { to: '/categories', label: 'Categorias' },
  { to: '/accounts', label: 'Contas' },
  { to: '/spending-limits', label: 'Limites de gastos' },
  { to: '/savings-goals', label: 'Metas de economia' },
  { to: '/recurring-transactions', label: 'Lançamentos recorrentes' },
  { to: '/compare', label: 'Comparar meses' },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white px-4 py-6 transition-transform duration-200 ease-out dark:border-neutral-800 dark:bg-neutral-900 lg:static lg:translate-x-0! ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="mb-6 flex items-center justify-between px-2">
            <Link to="/" onClick={onClose}>
              <Logo size="sm" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar menu"
              className="text-slate-400 hover:text-slate-700 lg:hidden dark:text-neutral-500 dark:hover:text-neutral-200"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 dark:bg-neutral-800 dark:text-neutral-100'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-neutral-800 dark:text-neutral-400">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `rounded-md px-3 py-2 font-medium ${
                isActive
                  ? 'bg-slate-100 text-slate-900 dark:bg-neutral-800 dark:text-neutral-100'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-neutral-200 dark:hover:bg-neutral-800'
              }`
            }
          >
            Configurações
          </NavLink>
          <span className="truncate px-3">{user?.name}</span>
          <button
            onClick={logout}
            className="rounded-md px-3 py-2 text-left font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
