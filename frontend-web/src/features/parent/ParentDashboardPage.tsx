import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@app/store/auth.store'
import { listChildren } from '@api/children.api'
import { listAssignments } from '@api/assignments.api'
import { Card } from '@shared/components/ui/Card'
import { Badge, statusBadge, statusLabel } from '@shared/components/ui/Badge'
import { PageSpinner } from '@shared/components/ui/Spinner'

export function ParentDashboardPage() {
  const user = useAuthStore((s) => s.user)

  const { data: childrenData, isLoading } = useQuery({
    queryKey: ['children'],
    queryFn: () => listChildren({ limit: 20 }),
  })

  if (isLoading) return <PageSpinner />

  const children = childrenData?.data ?? []

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {user?.fullName?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">Acompanhe o progresso dos seus filhos</p>
      </div>

      <div className="flex flex-col gap-4">
        {children.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">👨‍👧</p>
            <p className="text-gray-500">Nenhuma criança vinculada à sua conta.</p>
            <p className="text-xs text-gray-400 mt-1">Entre em contato com a escola para vincular.</p>
          </div>
        )}
        {children.map((child) => (
          <ChildProgressCard key={child.id} childId={child.id} childName={child.full_name} />
        ))}
      </div>
    </div>
  )
}

function ChildProgressCard({ childId, childName }: { childId: string; childName: string }) {
  const { data } = useQuery({
    queryKey: ['assignments', childId],
    queryFn:  () => listAssignments({ child_id: childId, limit: 5 }),
  })

  const assignments = data?.data ?? []
  const completed   = assignments.filter((a) => a.status === 'COMPLETED').length
  const total       = data?.meta.total ?? 0

  return (
    <Card>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary-dark">
          {childName[0]}
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-gray-900">{childName}</h2>
          <p className="text-sm text-gray-500">{completed} de {total} atividades concluídas</p>
        </div>
        <Link
          to={`/parent/progress/${childId}`}
          className="text-sm text-primary font-medium hover:text-primary-dark"
        >
          Ver progresso →
        </Link>
      </div>

      {/* Barra de progresso */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-success rounded-full transition-all"
          style={{ width: total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%' }}
        />
      </div>

      {/* Últimas atividades */}
      <div className="flex flex-col gap-1">
        {assignments.slice(0, 4).map((a) => (
          <div key={a.id} className="flex items-center justify-between py-1.5">
            <p className="text-sm text-gray-700 truncate flex-1">{a.activity_title}</p>
            <Badge variant={statusBadge(a.status)}>{statusLabel(a.status)}</Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}
