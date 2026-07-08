import type { FastifyInstance, FastifyRequest } from 'fastify'
import { assignmentsService } from './assignments.service'
import { createAssignmentSchema, updateAssignmentSchema } from './dto/assignments.dto'
import { ValidationError } from '../../core/middleware/error-handler.middleware'
import { requireTeacher } from '../../core/guards/roles.guard'
import type { JwtPayload, ChildJwtPayload } from '../../core/guards/roles.guard'

// Extrai identidade tanto de tokens adultos quanto de tokens de criança
function callerFrom(user: unknown): { sub: string; role: string } {
  const child = user as ChildJwtPayload
  if (child.type === 'child') return { sub: child.sub, role: 'CHILD' }
  const adult = user as JwtPayload
  return { sub: adult.sub, role: adult.role }
}

export async function assignmentsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', {
    onRequest: [app.authenticate],
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
    const { sub, role } = callerFrom(request.user)
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
    onRequest: [app.authenticate],
    schema: { tags: ['assignments'], summary: 'Buscar atribuição por ID', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest) => {
    const { sub, role } = callerFrom(request.user)
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
