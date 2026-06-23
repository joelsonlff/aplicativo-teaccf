import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listActivities, deleteActivity, type ActivityRow, type TeaDomain, type ActivityType } from '@api/activities.api'
import { Card } from '@shared/components/ui/Card'
import { Badge } from '@shared/components/ui/Badge'
import { Button } from '@shared/components/ui/Button'
import { Input } from '@shared/components/ui/Input'
import { Select } from '@shared/components/ui/Select'
import { PageSpinner } from '@shared/components/ui/Spinner'

const DOMAIN_OPTIONS = [
  { value: '', label: 'Todos os domínios' },
  { value: 'COGNITIVE',     label: '🧠 Cognitivo' },
  { value: 'COMMUNICATION', label: '💬 Comunicação' },
  { value: 'EMOTIONAL',     label: '❤️ Emocional' },
  { value: 'SOCIAL',        label: '👫 Social' },
  { value: 'ROUTINE',       label: '📋 Rotina' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'MATCHING',            label: 'Associação' },
  { value: 'SEQUENCE',            label: 'Sequência' },
  { value: 'EMOTION_RECOGNITION', label: 'Reconhecimento Emocional' },
  { value: 'COMMUNICATION',       label: 'Comunicação' },
  { value: 'ROUTINE',             label: 'Rotina' },
  { value: 'SOCIAL_STORY',        label: 'História Social' },
]

const DIFFICULTY_LABEL: Record<number, string> = { 1: '★', 2: '★★', 3: '★★★', 4: '★★★★', 5: '★★★★★' }
const DOMAIN_EMOJI: Record<string, string> = {
  COGNITIVE: '🧠', COMMUNICATION: '💬', EMOTIONAL: '❤️', SOCIAL: '👫', ROUTINE: '📋',
}

function ActivityCard({ activity, onDelete }: { activity: ActivityRow; onDelete: (id: string) => void }) {
  return (
    <Card className="flex gap-4 items-start">
      <div className="text-2xl shrink-0 mt-0.5">{DOMAIN_EMOJI[activity.domain] ?? '📚'}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-gray-900 leading-tight">{activity.title}</p>
          <span className="text-amber-400 text-sm shrink-0">{DIFFICULTY_LABEL[activity.difficulty]}</span>
        </div>
        {activity.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{activity.description}</p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Badge variant="info">{activity.type}</Badge>
          <Badge variant="default">{activity.domain}</Badge>
          {activity.is_template && <Badge variant="brand">Template</Badge>}
          <Badge variant="default">{Math.round(activity.duration_seconds / 60)}min</Badge>
        </div>
      </div>
      <div className="flex flex-col gap-2 shrink-0">
        <Link to={`/activities/${activity.id}/edit`}>
          <Button variant="ghost" size="sm">Editar</Button>
        </Link>
        <Button variant="danger" size="sm" onClick={() => onDelete(activity.id)}>
          Excluir
        </Button>
      </div>
    </Card>
  )
}

export function ActivityLibraryPage() {
  const [search, setSearch]   = useState('')
  const [domain, setDomain]   = useState<TeaDomain | ''>('')
  const [type, setType]       = useState<ActivityType | ''>('')
  const queryClient           = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['activities', { domain, type, search }],
    queryFn: () => listActivities({
      domain:  domain || undefined,
      type:    type || undefined,
      search:  search || undefined,
      limit:   50,
    }),
  })

  const { mutateAsync: remove } = useMutation({
    mutationFn: deleteActivity,
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['activities'] }),
  })

  if (isLoading) return <PageSpinner />

  const activities = data?.data ?? []

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atividades</h1>
          <p className="text-sm text-gray-500">{data?.meta.total ?? 0} disponíveis</p>
        </div>
        <Link to="/activities/new">
          <Button>+ Nova Atividade</Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          placeholder="Buscar por título..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select
          options={DOMAIN_OPTIONS}
          value={domain}
          onChange={(e) => setDomain(e.target.value as TeaDomain | '')}
          className="w-48"
        />
        <Select
          options={TYPE_OPTIONS}
          value={type}
          onChange={(e) => setType(e.target.value as ActivityType | '')}
          className="w-56"
        />
      </div>

      <div className="flex flex-col gap-3">
        {activities.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🧩</p>
            <p className="text-gray-500">Nenhuma atividade encontrada.</p>
            <Link to="/activities/new">
              <Button className="mt-4">Criar primeira atividade</Button>
            </Link>
          </div>
        )}
        {activities.map((a) => (
          <ActivityCard key={a.id} activity={a} onDelete={(id) => remove(id)} />
        ))}
      </div>
    </div>
  )
}
