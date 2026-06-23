import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore, type UserRole } from '@app/store/auth.store'

interface RoleRouteProps {
  allowedRoles: UserRole[]
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const user = useAuthStore((s) => s.user)

  if (!user || !allowedRoles.includes(user.role)) {
    // Redireciona para o dashboard correto baseado no role
    if (user?.role === 'TEACHER') return <Navigate to="/dashboard" replace />
    if (user?.role === 'PARENT') return <Navigate to="/parent/dashboard" replace />
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
