import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'
import { useState } from 'react'
import { getChild } from '@api/children.api'
import { getProgressSummary, listExecutions } from '@api/executions.api'
import { getProgressReport, type ProgressReport } from '@api/ai.api'
import { Card, CardHeader, CardTitle } from '@shared/components/ui/Card'
import { Button } from '@shared/components/ui/Button'
import { PageSpinner, Spinner } from '@shared/components/ui/Spinner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const DOMAIN_PT: Record<string, string> = {
  COGNITIVE: 'Cognitivo', COMMUNICATION: 'Comunicação',
  EMOTIONAL: 'Emocional', SOCIAL: 'Social', ROUTINE: 'Rotina',
}

function StatPill({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-background rounded-lg p-4">
      <span className="text-2xl font-bold text-brand">{value}</span>
      <span className="text-xs font-medium text-gray-700">{label}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}

export function ProgressPage() {
  const { childId } = useParams<{ childId: string }>()

  const { data: child, isLoading: loadingChild } = useQuery({
    queryKey: ['child', childId],
    queryFn:  () => getChild(childId!),
    enabled:  !!childId,
  })

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['progress-summary', childId],
    queryFn:  () => getProgressSummary(childId!),
    enabled:  !!childId,
  })

  const { data: executionsData } = useQuery({
    queryKey: ['executions', childId],
    queryFn:  () => listExecutions({ child_id: childId!, limit: 30 }),
    enabled:  !!childId,
  })

  if (loadingChild || loadingSummary) return <PageSpinner />
  if (!child) return <div className="p-6 text-gray-500">Aluno não encontrado.</div>

  // Dados para o gráfico de radar (por domínio)
  const radarData = Object.entries(summary?.domains ?? {}).map(([domain, d]) => ({
    domain: DOMAIN_PT[domain] ?? domain,
    score:  Math.round(d.avg_score ?? 0),
  }))

  // Execuções recentes para linha do tempo
  const executions = executionsData?.data ?? []
  const timelineData = executions
    .filter((e) => e.completed_at && e.score !== null)
    .slice(0, 15)
    .reverse()
    .map((e, i) => ({
      index: i + 1,
      score: e.score ?? 0,
      date:  format(new Date(e.completed_at!), 'dd/MM', { locale: ptBR }),
    }))

  // Contagem por domínio para barra
  const domainBarData = Object.entries(summary?.domains ?? {}).map(([domain, d]) => ({
    name:  DOMAIN_PT[domain] ?? domain,
    total: d.count,
    score: Math.round(d.avg_score ?? 0),
  }))

  const totalMinutes = Math.round((summary?.total_time_seconds ?? 0) / 60)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/children" className="hover:text-primary">Alunos</Link>
        <span>›</span>
        <Link to={`/children/${childId}`} className="hover:text-primary">{child.full_name}</Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Progresso</span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary-dark">
          {child.full_name[0]}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Progresso de {child.full_name}</h1>
      </div>

      {/* Stats resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatPill label="Execuções"   value={summary?.total_executions ?? 0} />
        <StatPill label="Concluídas"  value={summary?.completed_executions ?? 0} />
        <StatPill label="Score médio" value={summary?.average_score != null ? `${Math.round(summary.average_score)}%` : '—'} />
        <StatPill label="Tempo total" value={`${totalMinutes}min`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Radar por domínio */}
        {radarData.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Desempenho por Domínio TEA</CardTitle></CardHeader>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="#8B1C2C" fill="#8B1C2C" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Barras por domínio */}
        {domainBarData.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Atividades por Domínio</CardTitle></CardHeader>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={domainBarData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" name="Execuções" fill="#4A90A4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Linha do tempo de scores */}
      {timelineData.length > 1 && (
        <Card>
          <CardHeader><CardTitle>Evolução do Score (últimas execuções)</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timelineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#5BA35B"
                strokeWidth={2}
                dot={{ fill: '#5BA35B', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {(summary?.total_executions ?? 0) === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-gray-500">Nenhuma execução registrada ainda.</p>
        </div>
      )}

      {/* IA — Relatório em linguagem natural */}
      {(summary?.total_executions ?? 0) > 0 && (
        <AIProgressReport childId={childId!} />
      )}
    </div>
  )
}

function AIProgressReport({ childId }: { childId: string }) {
  const [enabled, setEnabled] = useState(false)

  const { data, isFetching, error } = useQuery<ProgressReport>({
    queryKey: ['ai-progress-report', childId],
    queryFn:  () => getProgressReport(childId),
    enabled,
    staleTime: 1000 * 60 * 15,
  })

  return (
    <Card className="border-brand/30 bg-brand/5 mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <CardTitle>Relatório da IA</CardTitle>
        </div>
        {!enabled && (
          <Button size="sm" onClick={() => setEnabled(true)}>
            Gerar relatório
          </Button>
        )}
        {enabled && !isFetching && data && (
          <Button variant="ghost" size="sm" onClick={() => setEnabled(false)}>
            Atualizar
          </Button>
        )}
      </CardHeader>

      {!enabled && (
        <p className="text-sm text-gray-500">
          Gere um relatório completo em linguagem natural sobre o progresso desta criança,
          com pontos fortes, desafios e sugestões pedagógicas.
        </p>
      )}

      {enabled && isFetching && (
        <div className="flex items-center gap-3 py-4">
          <Spinner size="sm" />
          <span className="text-sm text-gray-500">Analisando dados e gerando relatório...</span>
        </div>
      )}

      {enabled && error && (
        <p className="text-sm text-danger">
          Erro ao gerar relatório. Verifique se a GEMINI_API_KEY está configurada no servidor.
        </p>
      )}

      {data && !isFetching && (
        <div className="flex flex-col gap-5">
          {/* Resumo */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Resumo</p>
            <p className="text-sm text-gray-700 leading-relaxed">{data.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pontos fortes */}
            <div>
              <p className="text-sm font-semibold text-success mb-2">✅ Pontos fortes</p>
              <ul className="flex flex-col gap-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-success shrink-0">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            {/* Desafios */}
            <div>
              <p className="text-sm font-semibold text-warning mb-2">⚠️ Desafios</p>
              <ul className="flex flex-col gap-1">
                {data.challenges.map((c, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-warning shrink-0">•</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sugestões */}
          <div>
            <p className="text-sm font-semibold text-primary mb-2">💡 Sugestões pedagógicas</p>
            <ul className="flex flex-col gap-1">
              {data.suggestions.map((s, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-primary shrink-0">{i + 1}.</span>{s}
                </li>
              ))}
            </ul>
          </div>

          {/* Próximos passos */}
          {data.next_steps && (
            <div className="pt-3 border-t border-border">
              <p className="text-sm font-semibold text-gray-700 mb-1">🎯 Próximos passos</p>
              <p className="text-sm text-gray-700">{data.next_steps}</p>
            </div>
          )}

          <p className="text-xs text-gray-400">
            Gerado em {format(new Date(data.generated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      )}
    </Card>
  )
}
