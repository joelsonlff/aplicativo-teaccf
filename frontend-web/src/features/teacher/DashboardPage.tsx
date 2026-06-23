import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@app/store/auth.store'
import { listChildren } from '@api/children.api'
import { listAssignments } from '@api/assignments.api'
import { Card, CardHeader, CardTitle } from '@shared/components/ui/Card'
import { Badge, statusBadge, statusLabel } from '@shared/components/ui/Badge'
import { PageSpinner } from '@shared/components/ui/Spinner'
import { Button } from '@shared/components/ui/Button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </Card>
  )
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  const { data: childrenData, isLoading: loadingChildren } = useQuery({
    queryKey: ['children'],
    queryFn: () => listChildren({ limit: 100 }),
  })

  const { data: assignmentsData, isLoading: loadingAssignments } = useQuery({
    queryKey: ['assignments', 'recent'],
    queryFn: () => listAssignments({ limit: 10 }),
  })

  if (loadingChildren || loadingAssignments) return <PageSpinner />

  const totalChildren   = childrenData?.meta.total ?? 0
  const assignments     = assignmentsData?.data ?? []
  const pending         = assignments.filter((a) => a.status === 'PENDING').length
  const completed       = assignments.filter((a) => a.status === 'COMPLETED').length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {user?.fullName?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Alunos"            value={totalChildren} sub="cadastrados" color="text-brand" />
        <StatCard label="Atividades"         value={assignments.length} sub="atribuídas"  color="text-primary" />
        <StatCard label="Pendentes"          value={pending}     sub="aguardando execução" color="text-warning" />
        <StatCard label="Concluídas"         value={completed}   sub="total" color="text-success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alunos recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Alunos</CardTitle>
            <Link to="/children">
              <Button variant="ghost" size="sm">Ver todos</Button>
            </Link>
          </CardHeader>
          <div className="flex flex-col gap-2">
            {(childrenData?.data ?? []).slice(0, 5).map((child) => (
              <Link
                key={child.id}
                to={`/children/${child.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-background transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary-dark">
                  {child.full_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{child.full_name}</p>
                  <p className="text-xs text-gray-400">{child.communication_level}</p>
                </div>
              </Link>
            ))}
            {totalChildren === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400">Nenhum aluno cadastrado.</p>
                <Link to="/children">
                  <Button size="sm" className="mt-3">Cadastrar aluno</Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Atividades recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <Link to="/activities">
              <Button variant="ghost" size="sm">Ver todas</Button>
            </Link>
          </CardHeader>
          <div className="flex flex-col gap-2">
            {assignments.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.activity_title}</p>
                  <p className="text-xs text-gray-400">{a.activity_domain} · {a.activity_type}</p>
                </div>
                <Badge variant={statusBadge(a.status)}>{statusLabel(a.status)}</Badge>
              </div>
            ))}
            {assignments.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Nenhuma atividade atribuída.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
