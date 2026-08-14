import { Outlet } from 'react-router-dom'
import InstallPrompt from './InstallPrompt.jsx'
import Sidebar from './Sidebar.jsx'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-neutral-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <Outlet />
      </main>
      <InstallPrompt />
    </div>
  )
}
