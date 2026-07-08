import { GoogleGenerativeAI } from '@google/generative-ai'
import { geminiConfig } from '../../config/app.config'
import { childrenRepository } from '../children/children.repository'
import { activitiesRepository } from '../activities/activities.repository'
import { executionsRepository } from '../executions/executions.repository'
import { assignmentsRepository } from '../assignments/assignments.repository'
import { NotFoundError, ForbiddenError } from '../../core/middleware/error-handler.middleware'

export interface ActivityRecommendation {
  activity_id:  string
  title:        string
  type:         string
  domain:       string
  difficulty:   number
  reason:       string
  priority:     'HIGH' | 'MEDIUM' | 'LOW'
}

export interface ProgressReport {
  summary:       string
  strengths:     string[]
  challenges:    string[]
  suggestions:   string[]
  next_steps:    string
  generated_at:  string
}

// Índice de rotação entre chaves (distribui carga e serve como fallback)
let keyIndex = 0

async function generateWithFallback(prompt: string): Promise<string> {
  const keys = geminiConfig.apiKeys
  if (keys.length === 0) {
    throw new Error('Nenhuma GEMINI_API_KEY configurada. Adicione ao arquivo .env')
  }

  // Tenta cada chave em ordem, começando pela atual no round-robin
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const idx = (keyIndex + attempt) % keys.length
    const key = keys[idx]
    if (!key) continue
    try {
      const genAI = new GoogleGenerativeAI(key)
      const model = genAI.getGenerativeModel({ model: geminiConfig.model })
      const result = await model.generateContent(prompt)
      // Avança o índice para a próxima chamada (round-robin)
      keyIndex = (idx + 1) % keys.length
      return result.response.text()
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status
      // 429 = rate limit, 401/403 = chave inválida — tenta a próxima
      if (status === 429 || status === 401 || status === 403) continue
      throw err
    }
  }
  throw new Error('Todas as chaves Gemini atingiram o limite. Tente novamente em instantes.')
}

export class AIService {
  async recommendActivities(childId: string, teacherId: string, callerRole: string): Promise<ActivityRecommendation[]> {
    const child = await childrenRepository.findById(childId)
    if (!child) throw new NotFoundError('Criança', childId)
    await assertChildAccess(childId, teacherId, callerRole)

    const [summary, recentAssignments, availableActivities] = await Promise.all([
      executionsRepository.progressSummary(childId),
      assignmentsRepository.listByChild(childId, { page: 1, limit: 20 }),
      activitiesRepository.list({ created_by: teacherId, page: 1, limit: 50 }),
    ])

    const alreadyAssignedIds = new Set(recentAssignments.rows.map((a) => a.activity_id))
    const candidates = availableActivities.rows.filter((a) => !alreadyAssignedIds.has(a.id))

    if (candidates.length === 0) {
      return []
    }

    const prompt = buildRecommendationPrompt(child, summary, candidates)
    const text   = await generateWithFallback(prompt)
    return parseRecommendations(text, candidates)
  }

  async generateProgressReport(childId: string, callerId: string, callerRole: string): Promise<ProgressReport> {
    const child = await childrenRepository.findById(childId)
    if (!child) throw new NotFoundError('Criança', childId)
    await assertChildAccess(childId, callerId, callerRole)

    const [summary, executions] = await Promise.all([
      executionsRepository.progressSummary(childId),
      executionsRepository.listByChild(childId, { page: 1, limit: 30 }),
    ])

    const prompt = buildProgressReportPrompt(child, summary, executions.rows)
    const text   = await generateWithFallback(prompt)
    return parseProgressReport(text)
  }
}

// Mesma regra de vínculo do módulo children — evita vazar dados de crianças de terceiros
async function assertChildAccess(childId: string, callerId: string, callerRole: string): Promise<void> {
  if (callerRole === 'ADMIN') return

  const isTeacher = callerRole === 'TEACHER' && await childrenRepository.isTeacherLinked(callerId, childId)
  const isParent  = callerRole === 'PARENT'  && await childrenRepository.isParentLinked(callerId, childId)

  if (!isTeacher && !isParent) {
    throw new ForbiddenError('Você não tem acesso a esta criança')
  }
}

// ── Prompt builders ──────────────────────────────────────────────────────────

function buildRecommendationPrompt(
  child: Awaited<ReturnType<typeof childrenRepository.findById>>,
  summary: Awaited<ReturnType<typeof executionsRepository.progressSummary>>,
  candidates: Array<{ id: string; title: string; type: string; domain: string; difficulty: number; description: string | null }>,
): string {
  const domainScores = Object.entries(summary.domains)
    .map(([d, v]) => `${d}: score médio ${v.avg_score?.toFixed(0) ?? 'sem dados'}, ${v.count} execuções`)
    .join('\n')

  const candidateList = candidates.slice(0, 20).map((a) =>
    `- ID: ${a.id} | "${a.title}" | tipo: ${a.type} | domínio: ${a.domain} | dificuldade: ${a.difficulty}/5`
  ).join('\n')

  return `
Você é um especialista em educação para crianças com Transtorno do Espectro Autista (TEA).

## Perfil da Criança
- Nome: ${child!.full_name}
- Nível de comunicação: ${child!.communication_level}
- Perfil sensorial: ${child!.sensory_profile}
- Total de execuções: ${summary.total_executions}
- Score médio geral: ${summary.average_score?.toFixed(0) ?? 'sem dados'}%

## Desempenho por Domínio TEA
${domainScores || 'Sem histórico ainda'}

## Atividades Disponíveis
${candidateList}

## Tarefa
Selecione as 3 melhores atividades desta lista para esta criança agora.
Considere: domínios com menor score precisam de mais prática, dificuldade deve ser progressiva.

Responda SOMENTE em JSON válido, sem markdown, no formato:
[
  {
    "activity_id": "uuid-aqui",
    "reason": "Explicação em 1 frase em português",
    "priority": "HIGH" | "MEDIUM" | "LOW"
  }
]
`.trim()
}

function buildProgressReportPrompt(
  child: Awaited<ReturnType<typeof childrenRepository.findById>>,
  summary: Awaited<ReturnType<typeof executionsRepository.progressSummary>>,
  executions: Array<{ score: number | null; accuracy: number | null; completed_at: Date | null; was_assisted: boolean }>,
): string {
  const recentScores = executions
    .filter((e) => e.completed_at && e.score !== null)
    .slice(0, 10)
    .map((e) => `${e.score}% (assistido: ${e.was_assisted ? 'sim' : 'não'})`)
    .join(', ')

  const domainSummary = Object.entries(summary.domains)
    .map(([d, v]) => `${d}: ${v.count} atividades, score médio ${v.avg_score?.toFixed(0) ?? '—'}%`)
    .join('\n')

  return `
Você é um especialista em educação especial TEA. Gere um relatório de progresso em português brasileiro,
acessível para professores e pais.

## Dados da Criança
- Nome: ${child!.full_name}
- Comunicação: ${child!.communication_level}
- Total de execuções: ${summary.total_executions}
- Concluídas: ${summary.completed_executions}
- Score médio: ${summary.average_score?.toFixed(0) ?? '—'}%
- Tempo total: ${Math.round(summary.total_time_seconds / 60)} minutos
- Última atividade: ${summary.last_execution_at ? new Date(summary.last_execution_at).toLocaleDateString('pt-BR') : 'nunca'}

## Desempenho por Domínio
${domainSummary || 'Sem dados'}

## Scores Recentes
${recentScores || 'Sem execuções recentes'}

## Tarefa
Gere um relatório de progresso completo. Responda SOMENTE em JSON válido, sem markdown:
{
  "summary": "Parágrafo de resumo geral (3-4 frases)",
  "strengths": ["Ponto forte 1", "Ponto forte 2"],
  "challenges": ["Desafio 1", "Desafio 2"],
  "suggestions": ["Sugestão prática 1", "Sugestão prática 2", "Sugestão prática 3"],
  "next_steps": "Próximos passos recomendados (1-2 frases)"
}
`.trim()
}

// ── Response parsers ─────────────────────────────────────────────────────────

function parseRecommendations(
  text: string,
  candidates: Array<{ id: string; title: string; type: string; domain: string; difficulty: number }>,
): ActivityRecommendation[] {
  try {
    const json = extractJSON(text)
    const raw  = JSON.parse(json) as Array<{ activity_id: string; reason: string; priority: string }>
    return raw
      .map((r) => {
        const activity = candidates.find((c) => c.id === r.activity_id)
        if (!activity) return null
        return {
          activity_id: activity.id,
          title:       activity.title,
          type:        activity.type,
          domain:      activity.domain,
          difficulty:  activity.difficulty,
          reason:      r.reason,
          priority:    (r.priority as 'HIGH' | 'MEDIUM' | 'LOW') ?? 'MEDIUM',
        }
      })
      .filter((r): r is ActivityRecommendation => r !== null)
  } catch {
    return []
  }
}

function parseProgressReport(text: string): ProgressReport {
  try {
    const json = extractJSON(text)
    const raw  = JSON.parse(json) as Partial<ProgressReport>
    return {
      summary:      raw.summary      ?? 'Relatório gerado.',
      strengths:    raw.strengths    ?? [],
      challenges:   raw.challenges   ?? [],
      suggestions:  raw.suggestions  ?? [],
      next_steps:   raw.next_steps   ?? '',
      generated_at: new Date().toISOString(),
    }
  } catch {
    return {
      summary:      text.slice(0, 500),
      strengths:    [],
      challenges:   [],
      suggestions:  [],
      next_steps:   '',
      generated_at: new Date().toISOString(),
    }
  }
}

function extractJSON(text: string): string {
  // Remove blocos de markdown ```json ... ``` se presentes
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) return match[1].trim()
  // Tenta encontrar JSON diretamente
  const start = text.indexOf('[') !== -1 && text.indexOf('{') > text.indexOf('[') ? text.indexOf('[') : text.indexOf('{')
  const end   = text.lastIndexOf(']') !== -1 && text.lastIndexOf('}') < text.lastIndexOf(']') ? text.lastIndexOf(']') : text.lastIndexOf('}')
  if (start !== -1 && end !== -1) return text.slice(start, end + 1)
  return text
}

export const aiService = new AIService()
