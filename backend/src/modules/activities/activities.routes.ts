import type { FastifyInstance, FastifyRequest } from 'fastify'
import { activitiesService } from './activities.service'
import { createActivitySchema, updateActivitySchema } from './dto/activities.dto'
import { ValidationError, ForbiddenError } from '../../core/middleware/error-handler.middleware'
import { requireTeacher, requireAdultUser } from '../../core/guards/roles.guard'
import type { JwtPayload, ChildJwtPayload } from '../../core/guards/roles.guard'

export async function activitiesRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', {
    onRequest: [app.authenticate, requireAdultUser],
    schema: {
      tags: ['activities'],
      summary: 'Listar atividades disponíveis',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page:        { type: 'integer', default: 1, minimum: 1 },
          limit:       { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          type:        { type: 'string', enum: ['MATCHING', 'SEQUENCE', 'EMOTION_RECOGNITION', 'COMMUNICATION', 'ROUTINE', 'SOCIAL_STORY'] },
          domain:      { type: 'string', enum: ['COGNITIVE', 'COMMUNICATION', 'EMOTIONAL', 'SOCIAL', 'ROUTINE'] },
          difficulty:  { type: 'integer', minimum: 1, maximum: 5 },
          is_template: { type: 'boolean' },
          search:      { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest) => {
    const { sub, role, school_id } = request.user as JwtPayload
    const q = request.query as {
      page?: number; limit?: number; type?: string; domain?: string
      difficulty?: number; is_template?: boolean; search?: string
    }
    const { rows, total } = await activitiesService.list({
      callerId:    sub,
      callerRole:  role,
      school_id:   school_id,
      type:        q.type,
      domain:      q.domain,
      difficulty:  q.difficulty,
      is_template: q.is_template,
      search:      q.search,
      page:        q.page  ?? 1,
      limit:       q.limit ?? 20,
    })
    return {
      data: rows,
      meta: { total, page: q.page ?? 1, limit: q.limit ?? 20, pages: Math.ceil(total / (q.limit ?? 20)) },
    }
  })

  app.post('/', {
    onRequest: [app.authenticate, requireTeacher],
    schema: { tags: ['activities'], summary: 'Criar nova atividade', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply) => {
    const { sub, school_id } = request.user as JwtPayload
    const parsed = createActivitySchema.safeParse(request.body)
    if (!parsed.success) throw new ValidationError(parsed.error.flatten())

    const activity = await activitiesService.create(parsed.data, sub, school_id)
    return reply.status(201).send({ data: activity })
  })

  app.get('/:id', {
    onRequest: [app.authenticate],
    schema: { tags: ['activities'], summary: 'Buscar atividade por ID', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string }

    // Token de criança: só pode ver atividades que lhe foram atribuídas
    const child = request.user as ChildJwtPayload
    if (child.type === 'child') {
      const { assignmentsRepository } = await import('../assignments/assignments.repository')
      const assigned = await assignmentsRepository.childHasActivity(child.sub, id)
      if (!assigned) throw new ForbiddenError('Atividade não atribuída a esta criança')
    }

    const activity = await activitiesService.getById(id)
    return { data: activity }
  })

  app.patch('/:id', {
    onRequest: [app.authenticate, requireTeacher],
    schema: { tags: ['activities'], summary: 'Atualizar atividade', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest) => {
    const { sub, role } = request.user as JwtPayload
    const { id } = request.params as { id: string }
    const parsed = updateActivitySchema.safeParse(request.body)
    if (!parsed.success) throw new ValidationError(parsed.error.flatten())

    const activity = await activitiesService.update(id, parsed.data, sub, role)
    return { data: activity }
  })

  app.delete('/:id', {
    onRequest: [app.authenticate, requireTeacher],
    schema: { tags: ['activities'], summary: 'Desativar atividade', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply) => {
    const { sub, role } = request.user as JwtPayload
    const { id } = request.params as { id: string }
    await activitiesService.deactivate(id, sub, role)
    return reply.status(204).send()
  })
}
