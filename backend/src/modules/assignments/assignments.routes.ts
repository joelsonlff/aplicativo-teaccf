import type { FastifyInstance, FastifyRequest } from 'fastify'
import { assignmentsService } from './assignments.service'
import { createAssignmentSchema, updateAssignmentSchema } from './dto/assignments.dto'
import { ValidationError } from '../../core/middleware/error-handler.middleware'
import { requireTeacher, requireAdultUser } from '../../core/guards/roles.guard'
import type { JwtPayload } from '../../core/guards/roles.guard'

export async function assignmentsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', {
    onRequest: [app.authenticate, requireAdultUser],
    schema: {
      tags: ['assignments'],
      summary: 'Listar atribuições',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          child_id: { type: 'string', format: 'uuid' },
          status:   { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'SKIPPED'] },
          page:     { type: 'integer', default: 1 },
          limit:    { type: 'integer', default: 20 },
        },
      },
    },
  }, async (request: FastifyRequest) => {
    const { sub, role } = request.user as JwtPayload
    const q = request.query as { child_id?: string; status?: string; page?: number; limit?: number }
    const { rows, total } = await assignmentsService.list({
      callerId:   sub,
      callerRole: role,
      child_id:   q.child_id,
      status:     q.status,
      page:       q.page  ?? 1,
      limit:      q.limit ?? 20,
    })
    return { data: rows, meta: { total, page: q.page ?? 1, limit: q.limit ?? 20 } }
  })

  app.post('/', {
    onRequest: [app.authenticate, requireTeacher],
    schema: { tags: ['assignments'], summary: 'Atribuir atividade a uma criança', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply) => {
    const { sub } = request.user as JwtPayload
    const parsed = createAssignmentSchema.safeParse(request.body)
    if (!parsed.success) throw new ValidationError(parsed.error.flatten())

    const assignment = await assignmentsService.create(parsed.data, sub)
    return reply.status(201).send({ data: assignment })
  })

  app.get('/:id', {
    onRequest: [app.authenticate, requireAdultUser],
    schema: { tags: ['assignments'], summary: 'Buscar atribuição por ID', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest) => {
    const { sub, role } = request.user as JwtPayload
    const { id } = request.params as { id: string }
    const assignment = await assignmentsService.getById(id, sub, role)
    return { data: assignment }
  })

  app.patch('/:id', {
    onRequest: [app.authenticate, requireTeacher],
    schema: { tags: ['assignments'], summary: 'Atualizar atribuição', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest) => {
    const { sub, role } = request.user as JwtPayload
    const { id } = request.params as { id: string }
    const parsed = updateAssignmentSchema.safeParse(request.body)
    if (!parsed.success) throw new ValidationError(parsed.error.flatten())

    const assignment = await assignmentsService.update(id, parsed.data, sub, role)
    return { data: assignment }
  })

  app.delete('/:id', {
    onRequest: [app.authenticate, requireTeacher],
    schema: { tags: ['assignments'], summary: 'Remover atribuição', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply) => {
    const { sub, role } = request.user as JwtPayload
    const { id } = request.params as { id: string }
    await assignmentsService.remove(id, sub, role)
    return reply.status(204).send()
  })
}
