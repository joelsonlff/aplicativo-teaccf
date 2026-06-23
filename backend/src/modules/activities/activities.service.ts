import { activitiesRepository, type ActivitiesRepository, type ActivityRow } from './activities.repository'
import { NotFoundError, ForbiddenError } from '../../core/middleware/error-handler.middleware'
import type { CreateActivityInput, UpdateActivityInput } from './dto/activities.dto'

export class ActivitiesService {
  constructor(private readonly repo: ActivitiesRepository) {}

  async getById(id: string): Promise<ActivityRow> {
    const activity = await this.repo.findById(id)
    if (!activity || !activity.is_active) throw new NotFoundError('Atividade', id)
    return activity
  }

  async list(params: {
    callerId:  string
    callerRole: string
    school_id?: string
    type?: string
    domain?: string
    difficulty?: number
    is_template?: boolean
    search?: string
    page:  number
    limit: number
  }) {
    return this.repo.list({
      created_by:  params.callerRole === 'TEACHER' ? params.callerId : undefined,
      school_id:   params.school_id,
      type:        params.type,
      domain:      params.domain,
      difficulty:  params.difficulty,
      is_template: params.is_template,
      search:      params.search,
      page:        params.page,
      limit:       params.limit,
    })
  }

  async create(input: CreateActivityInput, teacherId: string, schoolId?: string | null): Promise<ActivityRow> {
    return this.repo.create({ ...input, created_by: teacherId, school_id: schoolId })
  }

  async update(id: string, input: UpdateActivityInput, callerId: string, callerRole: string): Promise<ActivityRow> {
    const activity = await this.getById(id)
    await this.assertOwnership(activity, callerId, callerRole)
    const updated = await this.repo.update(id, input)
    return updated!
  }

  async deactivate(id: string, callerId: string, callerRole: string): Promise<void> {
    const activity = await this.getById(id)
    await this.assertOwnership(activity, callerId, callerRole)
    await this.repo.update(id, { is_active: false })
  }

  private assertOwnership(activity: ActivityRow, callerId: string, callerRole: string): void {
    if (callerRole === 'ADMIN') return
    if (activity.created_by !== callerId) {
      throw new ForbiddenError('Você não é o autor desta atividade')
    }
  }
}

export const activitiesService = new ActivitiesService(activitiesRepository)
