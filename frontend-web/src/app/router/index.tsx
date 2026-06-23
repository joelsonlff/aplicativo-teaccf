import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'
import { LoginPage } from '@features/auth/LoginPage'
import { AppLayout } from '@features/layout/AppLayout'
import { DashboardPage } from '@features/teacher/DashboardPage'
import { ChildrenListPage } from '@features/teacher/children/ChildrenListPage'
import { ChildDetailPage } from '@features/teacher/children/ChildDetailPage'
import { ActivityLibraryPage } from '@features/teacher/activities/ActivityLibraryPage'
import { ActivityBuilderPage } from '@features/teacher/activities/ActivityBuilderPage'
import { ProgressPage } from '@features/teacher/progress/ProgressPage'
import { ParentDashboardPage } from '@features/parent/ParentDashboardPage'

const NotFoundPage = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-center">
      <p className="text-6xl font-bold text-brand mb-4">404</p>
      <p className="text-gray-500">Página não encontrada.</p>
    </div>
  </div>
)

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },

  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Redirect raiz para dashboard
          { index: true, element: <Navigate to="/dashboard" replace /> },

          // Rotas do Professor (e Admin)
          {
            element: <RoleRoute allowedRoles={['TEACHER', 'ADMIN']} />,
            children: [
              { path: 'dashboard',              element: <DashboardPage /> },
              { path: 'children',               element: <ChildrenListPage /> },
              { path: 'children/:id',           element: <ChildDetailPage /> },
              { path: 'activities',             element: <ActivityLibraryPage /> },
              { path: 'activities/new',         element: <ActivityBuilderPage /> },
              { path: 'activities/:id/edit',    element: <ActivityBuilderPage /> },
              { path: 'progress/:childId',      element: <ProgressPage /> },
            ],
          },

          // Rotas do Responsável
          {
            element: <RoleRoute allowedRoles={['PARENT']} />,
            children: [
              { path: 'parent/dashboard',              element: <ParentDashboardPage /> },
              { path: 'parent/children/:id',           element: <ChildDetailPage /> },
              { path: 'parent/progress/:childId',      element: <ProgressPage /> },
            ],
          },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
