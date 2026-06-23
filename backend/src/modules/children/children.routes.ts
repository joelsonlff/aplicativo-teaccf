import type { FastifyInstance, FastifyRequest } from 'fastify'
import { childrenService } from './children.service'
import { createChildSchema, updateChildSchema, setPinSchema } from './dto/children.dto'
import { ValidationError } from '../../core/middleware/error-handler.middleware'
import { requireTeacher, requireAdultUser } from '../../core/guards/roles.guard'
import type { JwtPayload } from '../../core/guards/roles.guard'

export async function childrenRoutes(app: FastifyInstance): Promise<void> {
  // GET /children — lista crianças do usuário autenticado
  app.get('/', {
    onRequest: [app.authenticate, requireAdultUser],
    schema: {
      tags: ['children'],
      summary: 'Listar crianças vinculadas ao usuário autenticado',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page:      { type: 'integer', default: 1, minimum: 1 },
          limit:     { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          search:    { type: 'string' },
          is_active: { type: 'boolean' },
        },
      },
    },
  }, async (request: FastifyRequest) => {
    const { sub, role, school_id } = request.user as JwtPayload
    const q = request.query as { page?: number; limit?: number; search?: string; is_active?: boolean }

    const { rows, total } = await childrenService.list({
      callerId:  sub,
      callerRole: role,
      school_id:  school_id,
      is_active:  q.is_active,
      search:     q.search,
      page:       q.page  ?? 1,
      limit:      q.limit ?? 20,
    })

    return {
      data: rows,
      meta: { total, page: q.page ?? 1, limit: q.limit ?? 20, pages: Math.ceil(total / (q.limit ?? 20)) },
    }
  })

  // POST /children — criar criança (TEACHER)
  app.post('/', {
    onRequest: [app.authenticate, requireTeacher],
    schema: { tags: ['children'], summary: 'Criar nova criança', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply) => {
    const { sub, school_id } = request.user as JwtPayload
    const parsed = createChildSchema.safeParse(request.body)
    if (!parsed.success) throw new ValidationError(parsed.error.flatten())

    const child = await childrenService.create(parsed.data, sub, school_id)
    return reply.status(201).send({ data: child })
  })

  // GET /children/:id — perfil completo
  app.get('/:id', {
    onRequest: [app.authenticate, requireAdultUser],
    schema: { tags: ['children'], summary: 'Perfil completo da criança', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest) => {
    const { sub, role } = request.user as JwtPayload
    const { id } = request.params as { id: string }
    const child = await childrenService.getById(id, sub, role)
    return { data: child }
  })

  // PATCH /children/:id — atualizar (TEACHER)
  app.patch('/:id', {
    onRequest: [app.authenticate, requireTeacher],
    schema: { tags: ['children'], summary: 'Atualizar perfil da criança', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest) => {
    const { sub, role } = request.user as JwtPayload
    const { id } = request.params as { id: string }
    const parsed = updateChildSchema.safeParse(request.body)
    if (!parsed.success) throw new ValidationError(parsed.error.flatten())

    const child = await childrenService.update(id, parsed.data, sub, role)
    return { data: child }
  })

  // POST /children/:id/pin — definir/resetar PIN (TEACHER)
  app.post('/:id/pin', {
    onRequest: [app.authenticate, requireTeacher],
    schema: { tags: ['children'], summary: 'Definir ou resetar PIN da criança', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply) => {
    const { sub, role } = request.user as JwtPayload
    const { id } = request.params as { id: string }
    const parsed = setPinSchema.safeParse(request.body)
    if (!parsed.success) throw new ValidationError(parsed.error.flatten())

    await childrenService.setPin(id, parsed.data, sub, role)
    return reply.status(204).send()
  })

  // GET /children/:id/assignments — atribuições da criança
  app.get('/:id/assignments', {
    onRequest: [app.authenticate, requireAdultUser],
    schema: {
      tags: ['children'],
      summary: 'Atividades atribuídas à criança',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'SKIPPED'] },
          page:   { type: 'integer', default: 1 },
          limit:  { type: 'integer', default: 20 },
        },
      },
    },
  }, async (request: FastifyRequest) => {
    const { sub, role } = request.user as JwtPayload
    const { id } = request.params as { id: string }
    // Verifica acesso à criança
    await childrenService.getById(id, sub, role)

    // Importação lazy para evitar dependência circular
    const { assignmentsRepository } = await import('../assignments/assignments.repository')
    const q = request.query as { status?: string; page?: number; limit?: number }
    const { rows, total } = await assignmentsRepository.listByChild(id, {
      status: q.status as any,
      page:   q.page  ?? 1,
      limit:  q.limit ?? 20,
    })
    return {
      data: rows,
      meta: { total, page: q.page ?? 1, limit: q.limit ?? 20 },
    }
  })

  // GET /children/:id/progress — resumo de progresso
  app.get('/:id/progress', {
    onRequest: [app.authenticate, requireAdultUser],
    schema: { tags: ['children'], summary: 'Resumo de progresso da criança', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest) => {
    const { sub, role } = request.user as JwtPayload
    const { id } = request.params as { id: string }
    await childrenService.getById(id, sub, role)

    const { executionsRepository } = await import('../executions/executions.repository')
    const stats = await executionsRepository.progressSummary(id)
    return { data: stats }
  })
}
