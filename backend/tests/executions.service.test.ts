import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/modules/children/children.repository', () => ({
  childrenRepository: {
    isTeacherLinked: vi.fn(),
    isParentLinked: vi.fn(),
  },
}))

vi.mock('../src/modules/assignments/assignments.repository', () => ({
  assignmentsRepository: {
    findById: vi.fn(),
    update: vi.fn(),
  },
}))

import { ExecutionsService } from '../src/modules/executions/executions.service'
import type { ExecutionsRepository, ExecutionRow } from '../src/modules/executions/executions.repository'
import { childrenRepository } from '../src/modules/children/children.repository'
import { assignmentsRepository } from '../src/modules/assignments/assignments.repository'
import { ForbiddenError, NotFoundError } from '../src/core/middleware/error-handler.middleware'

const isTeacherLinked = vi.mocked(childrenRepository.isTeacherLinked)
const isParentLinked  = vi.mocked(childrenRepository.isParentLinked)
const findAssignment  = vi.mocked(assignmentsRepository.findById)

function makeExecution(overrides: Partial<ExecutionRow> = {}): ExecutionRow {
  return {
    id: 'exec-1',
    assignment_id: 'assign-1',
    child_id: 'child-1',
    started_at: new Date(),
    completed_at: new Date(),
    duration_seconds: 60,
    score: 75,
    accuracy: 75,
    attempts: 4,
    response_data: {},
    behavioral_notes: null,
    was_assisted: false,
    device_info: {},
    created_at: new Date(),
    ...overrides,
  }
}

function makeRepo(overrides: Partial<ExecutionsRepository> = {}): ExecutionsRepository {
  return {
    findById: vi.fn().mockResolvedValue(makeExecution()),
    listByChild: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
    create: vi.fn().mockImplementation(async (p: Record<string, unknown>) => makeExecution(p as never)),
    progressSummary: vi.fn().mockResolvedValue({}),
    ...overrides,
  } as ExecutionsRepository
}

const baseInput = {
  assignment_id: 'assign-1',
  started_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  attempts: 4,
  response_data: { correct: 3, total: 4 },
  was_assisted: false,
  device_info: {},
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ExecutionsService.create', () => {
  it('rejeita atribuição inexistente', async () => {
    findAssignment.mockResolvedValue(null)
    const service = new ExecutionsService(makeRepo())
    await expect(service.create(baseInput, 'child-1')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('rejeita execução de atribuição de outra criança', async () => {
    findAssignment.mockResolvedValue({ child_id: 'outra-crianca' } as never)
    const service = new ExecutionsService(makeRepo())
    await expect(service.create(baseInput, 'child-1')).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('calcula o score no backend a partir dos dados brutos', async () => {
    findAssignment.mockResolvedValue({ child_id: 'child-1' } as never)
    const repo = makeRepo()
    const service = new ExecutionsService(repo)

    await service.create(baseInput, 'child-1')

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      score: 75,       // 3/4 — calculado no servidor, nunca no app
      accuracy: 75,
      child_id: 'child-1',
    }))
  })

  it('marca a atribuição como COMPLETED quando há completed_at', async () => {
    findAssignment.mockResolvedValue({ child_id: 'child-1' } as never)
    const service = new ExecutionsService(makeRepo())

    await service.create(baseInput, 'child-1')

    expect(assignmentsRepository.update).toHaveBeenCalledWith('assign-1', { status: 'COMPLETED' })
  })
})

describe('ExecutionsService — controle de acesso (IDOR)', () => {
  it('TEACHER sem vínculo não lista execuções da criança', async () => {
    isTeacherLinked.mockResolvedValue(false)
    const service = new ExecutionsService(makeRepo())

    await expect(service.listByChild('child-1', { page: 1, limit: 20 }, 'teacher-2', 'TEACHER'))
      .rejects.toBeInstanceOf(ForbiddenError)
  })

  it('PARENT vinculado acessa o resumo de progresso', async () => {
    isParentLinked.mockResolvedValue(true)
    const repo = makeRepo()
    const service = new ExecutionsService(repo)

    await service.progressSummary('child-1', 'parent-1', 'PARENT')

    expect(repo.progressSummary).toHaveBeenCalledWith('child-1')
  })

  it('PARENT sem vínculo não acessa o resumo de progresso', async () => {
    isParentLinked.mockResolvedValue(false)
    const service = new ExecutionsService(makeRepo())

    await expect(service.progressSummary('child-1', 'parent-2', 'PARENT'))
      .rejects.toBeInstanceOf(ForbiddenError)
  })

  it('CHILD não acessa execução de outra criança', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(makeExecution({ child_id: 'outra' })) })
    const service = new ExecutionsService(repo)

    await expect(service.getById('exec-1', 'child-1', 'CHILD'))
      .rejects.toBeInstanceOf(ForbiddenError)
  })

  it('ADMIN acessa sem verificação de vínculo', async () => {
    const service = new ExecutionsService(makeRepo())
    const result = await service.getById('exec-1', 'admin-1', 'ADMIN')
    expect(result.id).toBe('exec-1')
  })
})
