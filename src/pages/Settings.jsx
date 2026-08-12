import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

function extractErrorMessage(err, fallback) {
  const errors = err.response?.data?.errors
  if (errors) {
    const firstField = Object.keys(errors)[0]
    if (firstField) return errors[firstField][0]
  }
  return err.response?.data?.message ?? fallback
}

export default function Settings() {
  const { user, updateProfile, changePassword } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [profileForm, setProfileForm] = useState({ name: user?.name ?? '', email: user?.email ?? '' })
  const [profileError, setProfileError] = useState(null)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  const emptyPasswordForm = { current_password: '', password: '', password_confirmation: '' }
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm)
  const [passwordError, setPasswordError] = useState(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  async function handleProfileSubmit(event) {
    event.preventDefault()
    setProfileError(null)
    setProfileSuccess(false)
    setSavingProfile(true)

    try {
      await updateProfile(profileForm)
      setProfileSuccess(true)
    } catch (err) {
      setProfileError(extractErrorMessage(err, 'Não foi possível atualizar seus dados.'))
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)
    setSavingPassword(true)

    try {
      await changePassword(passwordForm)
      setPasswordForm(emptyPasswordForm)
      setPasswordSuccess(true)
    } catch (err) {
      setPasswordError(extractErrorMessage(err, 'Não foi possível alterar sua senha.'))
    } finally {
      setSavingPassword(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500'
  const labelClass = 'text-sm text-slate-600 dark:text-slate-400'

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Configurações</h1>

      <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
        <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">Aparência</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {theme === 'dark' ? 'Modo escuro' : 'Modo claro'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Escolha como o sistema deve ser exibido para você.</p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            role="switch"
            aria-checked={theme === 'dark'}
            className={`inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors ${
              theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
                theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <form
        onSubmit={handleProfileSubmit}
        className="space-y-4 rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900"
      >
        <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">Meus dados</h2>

        {profileError && <p className="text-sm text-red-600 dark:text-red-400">{profileError}</p>}
        {profileSuccess && <p className="text-sm text-emerald-600 dark:text-emerald-400">Dados atualizados com sucesso.</p>}

        <div className="space-y-1">
          <label className={labelClass}>Nome</label>
          <input
            type="text"
            required
            value={profileForm.name}
            onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClass}>E-mail</label>
          <input
            type="email"
            required
            value={profileForm.email}
            onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          {savingProfile ? 'Salvando...' : 'Salvar dados'}
        </button>
      </form>

      <form
        onSubmit={handlePasswordSubmit}
        className="space-y-4 rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900"
      >
        <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">Alterar senha</h2>

        {passwordError && <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>}
        {passwordSuccess && <p className="text-sm text-emerald-600 dark:text-emerald-400">Senha alterada com sucesso.</p>}

        <div className="space-y-1">
          <label className={labelClass}>Senha atual</label>
          <input
            type="password"
            required
            value={passwordForm.current_password}
            onChange={(event) => setPasswordForm({ ...passwordForm, current_password: event.target.value })}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClass}>Nova senha</label>
          <input
            type="password"
            required
            value={passwordForm.password}
            onChange={(event) => setPasswordForm({ ...passwordForm, password: event.target.value })}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClass}>Confirmar nova senha</label>
          <input
            type="password"
            required
            value={passwordForm.password_confirmation}
            onChange={(event) => setPasswordForm({ ...passwordForm, password_confirmation: event.target.value })}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={savingPassword}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          {savingPassword ? 'Salvando...' : 'Alterar senha'}
        </button>
      </form>
    </div>
  )
}
