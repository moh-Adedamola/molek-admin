
import { Navigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { MainLayout } from "./MainLayout"

export function PrivateRoute({ children, requiredRoles = [] }) {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⏳</div>
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user?.role)) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
            <p className="text-gray-600 dark:text-gray-400">Only admins and teachers can access this page.</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return <MainLayout>{children}</MainLayout>
}
