import type { FastifyInstance, FastifyRequest } from 'fastify'
import { executionsService } from './executions.service'
import { executionsRepository } from './executions.repository'
import { createExecutionSchema } from './dto/executions.dto'
import { ValidationError } from '../../core/middleware/error-handler.middleware'
import { requireChild, requireAdultUser } from '../../core/guards/roles.guard'
import type { JwtPayload, ChildJwtPayload } from '../../core/guards/roles.guard'

export async function executionsRoutes(app: FastifyInstance): Promise<void> {
  // POST /executions — enviado pelo app da criança após completar uma atividade
  app.post('/', {
    onRequest: [app.authenticate, requireChild],
    schema: {
      tags: ['executions'],
      summary: 'Registrar execução de atividade (criança)',
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest, reply) => {
    const child = request.user as ChildJwtPayload
    const parsed = createExecutionSchema.safeParse(request.body)
    if (!parsed.success) throw new ValidationError(parsed.error.flatten())

    const execution = await executionsService.create(parsed.data, child.sub)
    return reply.status(201).send({ data: execution })
  })

  // GET /executions — professor ou responsável lista execuções de uma criança
  app.get('/', {
    onRequest: [app.authenticate, requireAdultUser],
    schema: {
      tags: ['executions'],
      summary: 'Listar execuções de uma criança',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['child_id'],
        properties: {
          child_id: { type: 'string', format: 'uuid' },
          page:     { type: 'integer', default: 1 },
          limit:    { type: 'integer', default: 20 },
        },
      },
    },
  }, async (request: FastifyRequest) => {
    const q = request.query as { child_id: string; page?: number; limit?: number }
    const { rows, total } = await executionsRepository.listByChild(q.child_id, {
      page:  q.page  ?? 1,
      limit: q.limit ?? 20,
    })
    return { data: rows, meta: { total, page: q.page ?? 1, limit: q.limit ?? 20 } }
  })

  // GET /executions/:id — professor, responsável ou a própria criança
  app.get('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['executions'],
      summary: 'Buscar execução por ID',
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest) => {
    const user = request.user as JwtPayload | ChildJwtPayload
    const { id } = request.params as { id: string }

    const isChild = (user as ChildJwtPayload).type === 'child'
    const callerId   = user.sub
    const callerRole = isChild ? 'CHILD' : (user as JwtPayload).role

    const execution = await executionsService.getById(id, callerId, callerRole)
    return { data: execution }
  })

  // GET /executions/summary/:childId — resumo de progresso por criança
  app.get('/summary/:childId', {
    onRequest: [app.authenticate, requireAdultUser],
    schema: {
      tags: ['executions'],
      summary: 'Resumo de progresso de uma criança',
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest) => {
    const { childId } = request.params as { childId: string }
    const summary = await executionsRepository.progressSummary(childId)
    return { data: summary }
  })
}
