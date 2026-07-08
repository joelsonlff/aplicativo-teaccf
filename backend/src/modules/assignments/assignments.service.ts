import { assignmentsRepository, type AssignmentsRepository, type AssignmentRow } from './assignments.repository'
import { NotFoundError, ForbiddenError } from '../../core/middleware/error-handler.middleware'
import { childrenRepository } from '../children/children.repository'
import { activitiesRepository } from '../activities/activities.repository'
import type { CreateAssignmentInput, UpdateAssignmentInput } from './dto/assignments.dto'

export class AssignmentsService {
  constructor(private readonly repo: AssignmentsRepository) {}

  async getById(id: string, callerId: string, callerRole: string): Promise<AssignmentRow> {
    const assignment = await this.repo.findById(id)
    if (!assignment) throw new NotFoundError('Atribuição', id)
    await this.assertAccess(assignment, callerId, callerRole)
    return assignment
  }

  async list(params: {
    callerId: string
    callerRole: string
    child_id?: string
    status?: string
    page: number
    limit: number
  }) {
    // CHILD — vê apenas as próprias atribuições, ignorando qualquer child_id do request
    if (params.callerRole === 'CHILD') {
      return this.repo.listByChild(params.callerId, {
        status: params.status,
        page:   params.page,
        limit:  params.limit,
      })
    }

    if (params.callerRole === 'TEACHER' || params.callerRole === 'ADMIN') {
      return this.repo.listByTeacher(params.callerId, {
        child_id: params.child_id,
        status:   params.status,
        page:     params.page,
        limit:    params.limit,
      })
    }
    // PARENT — requer child_id e vínculo com a criança
    if (!params.child_id) return { rows: [], total: 0 }
    const linked = await childrenRepository.isParentLinked(params.callerId, params.child_id)
    if (!linked) throw new ForbiddenError('Você não tem acesso a esta criança')
    return this.repo.listByChild(params.child_id, { status: params.status, page: params.page, limit: params.limit })
  }

  async create(input: CreateAssignmentInput, teacherId: string): Promise<AssignmentRow> {
    // Garante que o professor tem acesso à criança
    const linked = await childrenRepository.isTeacherLinked(teacherId, input.child_id)
    if (!linked) throw new ForbiddenError('Você não é professor desta criança')

    // Garante que a atividade existe
    const activity = await activitiesRepository.findById(input.activity_id)
    if (!activity || !activity.is_active) throw new NotFoundError('Atividade', input.activity_id)

    return this.repo.create({
      activity_id:   input.activity_id,
      child_id:      input.child_id,
      assigned_by:   teacherId,
      due_date:      input.due_date,
      order_index:   input.order_index,
      custom_params: input.custom_params,
      notes:         input.notes,
    })
  }

  async update(id: string, input: UpdateAssignmentInput, callerId: string, callerRole: string): Promise<AssignmentRow> {
    const assignment = await this.getById(id, callerId, callerRole)
    if (assignment.assigned_by !== callerId && callerRole !== 'ADMIN') {
      throw new ForbiddenError('Apenas o professor que atribuiu pode modificar esta atribuição')
    }
    const updated = await this.repo.update(id, input)
    return updated!
  }

  async remove(id: string, callerId: string, callerRole: string): Promise<void> {
    const assignment = await this.getById(id, callerId, callerRole)
    if (assignment.assigned_by !== callerId && callerRole !== 'ADMIN') {
      throw new ForbiddenError('Apenas o professor que atribuiu pode remover esta atribuição')
    }
    await this.repo.delete(id)
  }

  private async assertAccess(assignment: AssignmentRow, callerId: string, callerRole: string): Promise<void> {
    if (callerRole === 'ADMIN') return
    if (callerRole === 'CHILD') {
      if (assignment.child_id !== callerId) throw new ForbiddenError('Acesso negado a esta atribuição')
      return
    }
    if (callerRole === 'TEACHER') {
      const linked = await childrenRepository.isTeacherLinked(callerId, assignment.child_id)
      if (!linked) throw new ForbiddenError('Acesso negado a esta atribuição')
      return
    }
    if (callerRole === 'PARENT') {
      const linked = await childrenRepository.isParentLinked(callerId, assignment.child_id)
      if (!linked) throw new ForbiddenError('Acesso negado a esta atribuição')
    }
  }
}

export const assignmentsService = new AssignmentsService(assignmentsRepository)
