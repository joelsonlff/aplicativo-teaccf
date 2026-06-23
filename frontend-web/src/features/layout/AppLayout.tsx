import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@app/store/auth.store'
import { logout } from '@api/auth.api'
import { clsx } from 'clsx'

interface NavItem { to: string; label: string; icon: string }

const TEACHER_NAV: NavItem[] = [
  { to: '/dashboard',  label: 'Dashboard',    icon: '📊' },
  { to: '/children',   label: 'Alunos',        icon: '👧' },
  { to: '/activities', label: 'Atividades',    icon: '🧩' },
]

const PARENT_NAV: NavItem[] = [
  { to: '/parent/dashboard', label: 'Dashboard', icon: '📊' },
]

export function AppLayout() {
  const navigate     = useNavigate()
  const user         = useAuthStore((s) => s.user)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const logoutStore  = useAuthStore((s) => s.logout)

  const nav = user?.role === 'PARENT' ? PARENT_NAV : TEACHER_NAV

  async function handleLogout() {
    if (refreshToken) await logout(refreshToken)
    logoutStore()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-56 flex flex-col bg-brand text-white shrink-0">
        {/* Brand header */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/20">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
            CF
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold">Coração Feliz</p>
            <p className="text-xs text-white/60">Plataforma TEA</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-white/20">
          <p className="text-xs font-medium text-white truncate">{user?.fullName}</p>
          <p className="text-xs text-white/50 truncate mb-3">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="text-xs text-white/60 hover:text-white transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
