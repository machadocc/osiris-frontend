import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const links = [
  { to: '/', label: 'Painel' },
  { to: '/transactions', label: 'Transações' },
  { to: '/categories', label: 'Categorias' },
  { to: '/accounts', label: 'Contas' },
  { to: '/spending-limits', label: 'Limites de gastos' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900">
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `rounded-md px-3 py-2 font-medium ${
              isActive
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
            }`
          }
        >
          Configurações
        </NavLink>
        <span className="truncate px-3">{user?.name}</span>
        <button
          onClick={logout}
          className="rounded-md px-3 py-2 text-left font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          Sair
        </button>
      </div>
    </aside>
  )
}
