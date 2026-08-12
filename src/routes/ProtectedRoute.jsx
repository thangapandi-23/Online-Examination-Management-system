import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/ui/Spinner'

export default function ProtectedRoute({ allowedRoles }) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to correct dashboard based on role
    if (role === 'admin')   return <Navigate to="/admin/dashboard" replace />
    if (role === 'teacher') return <Navigate to="/teacher/dashboard" replace />
    if (role === 'student') return <Navigate to="/student/dashboard" replace />
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
