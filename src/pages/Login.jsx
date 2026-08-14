import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await login(form)
      navigate('/')
    } catch {
      setError('E-mail ou senha inválidos.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4 dark:bg-neutral-950">
      <Logo size="lg" />

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow-sm dark:bg-neutral-900"
      >
        <h1 className="text-xl font-semibold text-slate-900 dark:text-neutral-100">Entrar</h1>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="space-y-1">
          <label className="text-sm text-slate-600 dark:text-neutral-400">E-mail</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-slate-600 dark:text-neutral-400">Senha</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="text-center text-sm text-slate-500 dark:text-neutral-400">
          Não tem conta?{' '}
          <Link to="/register" className="font-medium text-slate-900 dark:text-neutral-100">
            Cadastre-se
          </Link>
        </p>
      </form>
    </div>
  )
}
