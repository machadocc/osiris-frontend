import { createContext, useContext, useEffect, useState } from 'react'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      setLoading(false)
      return
    }

    authApi
      .me()
      .then(setUser)
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  async function login(credentials) {
    const { user, token } = await authApi.login(credentials)
    localStorage.setItem('token', token)
    setUser(user)
  }

  async function register(data) {
    const { user, token } = await authApi.register(data)
    localStorage.setItem('token', token)
    setUser(user)
  }

  async function logout() {
    await authApi.logout().catch(() => {})
    localStorage.removeItem('token')
    setUser(null)
  }

  async function updateProfile(data) {
    const updatedUser = await authApi.updateProfile(data)
    setUser(updatedUser)
    return updatedUser
  }

  async function changePassword(data) {
    await authApi.changePassword(data)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
