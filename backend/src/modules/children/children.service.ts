import bcrypt from 'bcryptjs'
import { childrenRepository, type ChildrenRepository, type ChildRow } from './children.repository'
import { NotFoundError, ForbiddenError } from '../../core/middleware/error-handler.middleware'
import type { CreateChildInput, UpdateChildInput, SetPinInput } from './dto/children.dto'

export class ChildrenService {
  constructor(private readonly repo: ChildrenRepository) {}

  async getById(id: string, callerId: string, callerRole: string): Promise<ChildRow> {
    const child = await this.repo.findById(id)
    if (!child) throw new NotFoundError('Criança', id)
    await this.assertAccess(id, callerId, callerRole)
    return child
  }

  async list(params: {
    callerId: string
    callerRole: string
    school_id?: string
    is_active?: boolean
    search?: string
    page: number
    limit: number
  }) {
    const listParams: Parameters<ChildrenRepository['list']>[0] = {
      page: params.page,
      limit: params.limit,
      school_id: params.school_id,
      is_active: params.is_active ?? true,
      search: params.search,
    }

    if (params.callerRole === 'TEACHER') listParams.teacher_id = params.callerId
    if (params.callerRole === 'PARENT')  listParams.parent_id  = params.callerId

    return this.repo.list(listParams)
  }

  async create(input: CreateChildInput, teacherId: string, schoolId?: string | null): Promise<ChildRow> {
    const pin_hash = await bcrypt.hash(input.pin, 12)

    const child = await this.repo.create({
      full_name:            input.full_name,
      birth_date:           input.birth_date,
      pin_hash,
      communication_level:  input.communication_level,
      sensory_profile:      input.sensory_profile,
      preferred_modalities: input.preferred_modalities,
      notes:                input.notes,
      tea_profile:          input.tea_profile,
      created_by:           teacherId,
      school_id:            schoolId,
    })

    await this.repo.linkTeacher(teacherId, child.id)
    return child
  }

  async update(id: string, input: UpdateChildInput, callerId: string, callerRole: string): Promise<ChildRow> {
    await this.assertTeacherAccess(id, callerId, callerRole)
    const updated = await this.repo.update(id, input)
    if (!updated) throw new NotFoundError('Criança', id)
    return updated
  }

  async setPin(id: string, input: SetPinInput, callerId: string, callerRole: string): Promise<void> {
    await this.assertTeacherAccess(id, callerId, callerRole)
    const pin_hash = await bcrypt.hash(input.pin, 12)
    await this.repo.updatePin(id, pin_hash)
  }

  private async assertAccess(childId: string, callerId: string, callerRole: string): Promise<void> {
    if (callerRole === 'ADMIN') return

    const isTeacher = callerRole === 'TEACHER' && await this.repo.isTeacherLinked(callerId, childId)
    const isParent  = callerRole === 'PARENT'  && await this.repo.isParentLinked(callerId, childId)

    if (!isTeacher && !isParent) {
      throw new ForbiddenError('Você não tem acesso a esta criança')
    }
  }

  private async assertTeacherAccess(childId: string, callerId: string, callerRole: string): Promise<void> {
    if (callerRole === 'ADMIN') return
    if (callerRole !== 'TEACHER') throw new ForbiddenError('Apenas professores podem editar crianças')

    const linked = await this.repo.isTeacherLinked(callerId, childId)
    if (!linked) throw new ForbiddenError('Você não é professor desta criança')
  }
}

export const childrenService = new ChildrenService(childrenRepository)
