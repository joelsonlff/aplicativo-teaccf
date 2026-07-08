import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/modules/children/children.repository', () => ({
  childrenRepository: {
    isTeacherLinked: vi.fn(),
    isParentLinked: vi.fn(),
  },
}))

vi.mock('../src/modules/activities/activities.repository', () => ({
  activitiesRepository: {
    findById: vi.fn(),
  },
}))

import { AssignmentsService } from '../src/modules/assignments/assignments.service'
import type { AssignmentsRepository, AssignmentRow } from '../src/modules/assignments/assignments.repository'
import { childrenRepository } from '../src/modules/children/children.repository'
import { activitiesRepository } from '../src/modules/activities/activities.repository'
import { ForbiddenError } from '../src/core/middleware/error-handler.middleware'

const isTeacherLinked = vi.mocked(childrenRepository.isTeacherLinked)
const isParentLinked  = vi.mocked(childrenRepository.isParentLinked)
const findActivity    = vi.mocked(activitiesRepository.findById)

function makeAssignment(overrides: Partial<AssignmentRow> = {}): AssignmentRow {
  return {
    id: 'assign-1',
    activity_id: 'act-1',
    child_id: 'child-1',
    assigned_by: 'teacher-1',
    status: 'PENDING',
    due_date: null,
    order_index: 1,
    custom_params: {},
    notes: null,
    assigned_at: new Date(),
    completed_at: null,
    ...overrides,
  }
}

function makeRepo(overrides: Partial<AssignmentsRepository> = {}): AssignmentsRepository {
  return {
    findById: vi.fn().mockResolvedValue(makeAssignment()),
    listByChild: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
    listByTeacher: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
    create: vi.fn().mockResolvedValue(makeAssignment()),
    update: vi.fn().mockResolvedValue(makeAssignment()),
    delete: vi.fn().mockResolvedValue(undefined),
    childHasActivity: vi.fn().mockResolvedValue(true),
    ...overrides,
  } as AssignmentsRepository
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AssignmentsService.list — controle de acesso', () => {
  it('PARENT sem vínculo com a criança é bloqueado (IDOR)', async () => {
    isParentLinked.mockResolvedValue(false)
    const service = new AssignmentsService(makeRepo())

    await expect(service.list({
      callerId: 'parent-1', callerRole: 'PARENT', child_id: 'child-de-outro', page: 1, limit: 20,
    })).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('PARENT vinculado lista as atribuições da criança', async () => {
    isParentLinked.mockResolvedValue(true)
    const repo = makeRepo()
    const service = new AssignmentsService(repo)

    await service.list({ callerId: 'parent-1', callerRole: 'PARENT', child_id: 'child-1', page: 1, limit: 20 })

    expect(repo.listByChild).toHaveBeenCalledWith('child-1', expect.anything())
  })

  it('CHILD sempre lista as próprias atribuições, ignorando child_id do request', async () => {
    const repo = makeRepo()
    const service = new AssignmentsService(repo)

    await service.list({
      callerId: 'child-1', callerRole: 'CHILD',
      child_id: 'outra-crianca',  // tentativa de acessar outra criança
      page: 1, limit: 20,
    })

    expect(repo.listByChild).toHaveBeenCalledWith('child-1', expect.anything())
  })
})

describe('AssignmentsService.getById — controle de acesso', () => {
  it('CHILD não acessa atribuição de outra criança', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(makeAssignment({ child_id: 'outra' })) })
    const service = new AssignmentsService(repo)

    await expect(service.getById('assign-1', 'child-1', 'CHILD'))
      .rejects.toBeInstanceOf(ForbiddenError)
  })

  it('CHILD acessa a própria atribuição', async () => {
    const service = new AssignmentsService(makeRepo())
    const result = await service.getById('assign-1', 'child-1', 'CHILD')
    expect(result.id).toBe('assign-1')
  })

  it('TEACHER sem vínculo é bloqueado', async () => {
    isTeacherLinked.mockResolvedValue(false)
    const service = new AssignmentsService(makeRepo())

    await expect(service.getById('assign-1', 'teacher-2', 'TEACHER'))
      .rejects.toBeInstanceOf(ForbiddenError)
  })
})

describe('AssignmentsService.create — envio de atividade para casa', () => {
  it('professor só atribui a crianças vinculadas a ele', async () => {
    isTeacherLinked.mockResolvedValue(false)
    const service = new AssignmentsService(makeRepo())

    await expect(service.create(
      { activity_id: 'act-1', child_id: 'child-alheio', order_index: 1, custom_params: {} },
      'teacher-1',
    )).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('professor vinculado atribui com sucesso', async () => {
    isTeacherLinked.mockResolvedValue(true)
    findActivity.mockResolvedValue({ id: 'act-1', is_active: true } as never)
    const repo = makeRepo()
    const service = new AssignmentsService(repo)

    await service.create(
      { activity_id: 'act-1', child_id: 'child-1', order_index: 1, custom_params: {} },
      'teacher-1',
    )

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      activity_id: 'act-1', child_id: 'child-1', assigned_by: 'teacher-1',
    }))
  })
})
