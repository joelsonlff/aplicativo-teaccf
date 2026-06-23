import { executionsRepository, type ExecutionsRepository, type ExecutionRow } from './executions.repository'
import { NotFoundError, ForbiddenError } from '../../core/middleware/error-handler.middleware'
import { assignmentsRepository } from '../assignments/assignments.repository'
import type { CreateExecutionInput } from './dto/executions.dto'

function calculateScore(responseData: Record<string, unknown>): { score: number | null; accuracy: number | null } {
  // Cada tipo de atividade envia dados brutos diferentes.
  // Formato esperado: { correct: number, total: number } ou { steps_completed: number, total_steps: number }
  const correct = typeof responseData['correct'] === 'number' ? responseData['correct'] : null
  const total   = typeof responseData['total']   === 'number' ? responseData['total']   : null

  if (correct !== null && total !== null && total > 0) {
    const accuracy = Math.round((correct / total) * 100)
    const score    = accuracy
    return { score, accuracy }
  }

  const steps     = typeof responseData['steps_completed'] === 'number' ? responseData['steps_completed'] : null
  const totalSteps = typeof responseData['total_steps']   === 'number' ? responseData['total_steps']     : null

  if (steps !== null && totalSteps !== null && totalSteps > 0) {
    const accuracy = Math.round((steps / totalSteps) * 100)
    return { score: accuracy, accuracy }
  }

  return { score: null, accuracy: null }
}

export class ExecutionsService {
  constructor(private readonly repo: ExecutionsRepository) {}

  async getById(id: string, callerId: string, callerRole: string): Promise<ExecutionRow> {
    const exec = await this.repo.findById(id)
    if (!exec) throw new NotFoundError('Execução', id)
    if (callerRole === 'CHILD' && exec.child_id !== callerId) {
      throw new ForbiddenError('Acesso negado')
    }
    return exec
  }

  async create(input: CreateExecutionInput, childId: string): Promise<ExecutionRow> {
    const assignment = await assignmentsRepository.findById(input.assignment_id)
    if (!assignment) throw new NotFoundError('Atribuição', input.assignment_id)
    if (assignment.child_id !== childId) throw new ForbiddenError('Esta atribuição não pertence à criança')

    const { score, accuracy } = calculateScore(input.response_data)

    const execution = await this.repo.create({
      assignment_id:    input.assignment_id,
      child_id:         childId,
      started_at:       input.started_at,
      completed_at:     input.completed_at,
      duration_seconds: input.duration_seconds,
      score:            score ?? undefined,
      accuracy:         accuracy ?? undefined,
      attempts:         input.attempts,
      response_data:    input.response_data,
      behavioral_notes: input.behavioral_notes,
      was_assisted:     input.was_assisted,
      device_info:      input.device_info,
    })

    if (input.completed_at) {
      await assignmentsRepository.update(input.assignment_id, { status: 'COMPLETED' })
    }

    return execution
  }
}

export const executionsService = new ExecutionsService(executionsRepository)
