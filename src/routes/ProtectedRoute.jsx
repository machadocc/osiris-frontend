import { Navigate, Outlet } from 'react-router-dom'
import Loading from '../components/Loading.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading className="h-screen" />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
