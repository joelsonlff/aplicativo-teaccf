import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getChild } from '@api/children.api'
import { listAssignments, createAssignment, deleteAssignment } from '@api/assignments.api'
import { listActivities } from '@api/activities.api'
import { getRecommendations, type ActivityRecommendation } from '@api/ai.api'
import { Card, CardHeader, CardTitle } from '@shared/components/ui/Card'
import { Badge, statusBadge, statusLabel } from '@shared/components/ui/Badge'
import { Button } from '@shared/components/ui/Button'
import { Select } from '@shared/components/ui/Select'
import { PageSpinner, Spinner } from '@shared/components/ui/Spinner'

export function ChildDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [assigning, setAssigning] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState('')
  const queryClient = useQueryClient()

  const { data: child, isLoading: loadingChild } = useQuery({
    queryKey: ['child', id],
    queryFn:  () => getChild(id!),
    enabled:  !!id,
  })

  const { data: assignmentsData, isLoading: loadingAssignments } = useQuery({
    queryKey: ['assignments', id],
    queryFn:  () => listAssignments({ child_id: id!, limit: 20 }),
    enabled:  !!id,
  })

  const { data: activitiesData } = useQuery({
    queryKey: ['activities'],
    queryFn:  () => listActivities({ limit: 100 }),
    enabled:  assigning,
  })

  const { mutateAsync: assign, isPending: assigning_ } = useMutation({
    mutationFn: () => createAssignment({
      activity_id:  selectedActivity,
      child_id:     id!,
      order_index:  (assignmentsData?.data.length ?? 0) + 1,
      custom_params: {},
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', id] })
      setAssigning(false)
      setSelectedActivity('')
    },
  })

  const { mutateAsync: removeAssignment } = useMutation({
    mutationFn: deleteAssignment,
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['assignments', id] }),
  })

  if (loadingChild) return <PageSpinner />
  if (!child) return <div className="p-6 text-gray-500">Aluno não encontrado.</div>

  const assignments = assignmentsData?.data ?? []

  const activityOptions = (activitiesData?.data ?? []).map((a) => ({
    value: a.id,
    label: `${a.title} (${a.type})`,
  }))

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/children" className="hover:text-primary">Alunos</Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">{child.full_name}</span>
      </div>

      {/* Profile */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary-dark shrink-0">
            {child.full_name[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{child.full_name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="info">{child.communication_level.replace('_', '-')}</Badge>
              <Badge variant="default">{child.sensory_profile}</Badge>
              {!child.is_active && <Badge variant="danger">Inativo</Badge>}
            </div>
          </div>
          <Link to={`/progress/${child.id}`}>
            <Button variant="ghost" size="sm">Ver progresso</Button>
          </Link>
        </div>
        {child.notes && (
          <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-border">{child.notes}</p>
        )}
      </Card>

      {/* Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Atribuídas</CardTitle>
          <Button size="sm" onClick={() => setAssigning((v) => !v)}>
            {assigning ? 'Cancelar' : '+ Atribuir'}
          </Button>
        </CardHeader>

        {assigning && (
          <div className="flex gap-3 mb-4 p-3 bg-background rounded-lg border border-border">
            <Select
              options={activityOptions}
              placeholder="Selecione uma atividade..."
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="flex-1"
            />
            <Button
              size="sm"
              disabled={!selectedActivity}
              loading={assigning_}
              onClick={() => assign()}
            >
              Atribuir
            </Button>
          </div>
        )}

        {loadingAssignments ? (
          <PageSpinner />
        ) : assignments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Nenhuma atividade atribuída ainda.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {assignments.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.activity_title}</p>
                  <p className="text-xs text-gray-400">{a.activity_domain} · {a.activity_type}</p>
                </div>
                <Badge variant={statusBadge(a.status)}>{statusLabel(a.status)}</Badge>
                {a.status === 'PENDING' && (
                  <button
                    onClick={() => removeAssignment(a.id)}
                    className="text-xs text-gray-400 hover:text-danger transition-colors ml-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* IA — Recomendações */}
      <AIRecommendationsCard childId={id!} onAssign={(activityId) => {
        setSelectedActivity(activityId)
        setAssigning(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }} />
    </div>
  )
}

const PRIORITY_LABEL: Record<string, string> = { HIGH: '🔴 Alta', MEDIUM: '🟡 Média', LOW: '🟢 Baixa' }
const DOMAIN_EMOJI: Record<string, string>   = {
  COGNITIVE: '🧠', COMMUNICATION: '💬', EMOTIONAL: '❤️', SOCIAL: '👫', ROUTINE: '📋',
}

function AIRecommendationsCard({ childId, onAssign }: { childId: string; onAssign: (id: string) => void }) {
  const [enabled, setEnabled] = useState(false)

  const { data, isFetching, error } = useQuery({
    queryKey: ['ai-recommendations', childId],
    queryFn:  () => getRecommendations(childId),
    enabled,
    staleTime: 1000 * 60 * 10,   // recomendações ficam frescas por 10 min
  })

  const recommendations = (data ?? []) as ActivityRecommendation[]

  return (
    <Card className="border-brand/30 bg-brand/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <CardTitle>Sugestões da IA</CardTitle>
        </div>
        {!enabled && (
          <Button size="sm" onClick={() => setEnabled(true)}>
            Gerar sugestões
          </Button>
        )}
        {enabled && !isFetching && (
          <Button variant="ghost" size="sm" onClick={() => setEnabled(false)}>
            Atualizar
          </Button>
        )}
      </CardHeader>

      {!enabled && (
        <p className="text-sm text-gray-500">
          Clique em <strong>Gerar sugestões</strong> para receber recomendações personalizadas de atividades
          baseadas no perfil e histórico desta criança.
        </p>
      )}

      {enabled && isFetching && (
        <div className="flex items-center gap-3 py-4">
          <Spinner size="sm" />
          <span className="text-sm text-gray-500">Analisando perfil e histórico...</span>
        </div>
      )}

      {enabled && error && (
        <p className="text-sm text-danger">
          Erro ao gerar sugestões. Verifique se a GEMINI_API_KEY está configurada no servidor.
        </p>
      )}

      {enabled && !isFetching && recommendations.length === 0 && !error && (
        <p className="text-sm text-gray-500">Nenhuma sugestão disponível no momento.</p>
      )}

      {enabled && !isFetching && recommendations.length > 0 && (
        <div className="flex flex-col gap-3">
          {recommendations.map((rec) => (
            <div key={rec.activity_id} className="flex items-start gap-3 p-3 bg-surface rounded-lg border border-border">
              <span className="text-xl shrink-0">{DOMAIN_EMOJI[rec.domain] ?? '📚'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900">{rec.title}</p>
                  <span className="text-xs text-gray-400">{PRIORITY_LABEL[rec.priority]}</span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">{rec.reason}</p>
              </div>
              <Button size="sm" onClick={() => onAssign(rec.activity_id)}>
                Atribuir
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
