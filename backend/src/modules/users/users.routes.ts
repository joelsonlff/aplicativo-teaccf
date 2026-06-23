import type { FastifyInstance, FastifyRequest } from 'fastify'
import { usersService } from './users.service'
import { createUserSchema, updateUserSchema, changePasswordSchema } from './dto/users.dto'
import { ValidationError } from '../../core/middleware/error-handler.middleware'
import { requireAdmin } from '../../core/guards/roles.guard'
import type { JwtPayload } from '../../core/guards/roles.guard'

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  // ── Perfil próprio ─────────────────────────────────────────────────────

  app.get('/me', {
    onRequest: [app.authenticate],
    schema: { tags: ['users'], summary: 'Perfil do usuário autenticado', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest) => {
    const { sub } = request.user as JwtPayload
    const user = await usersService.getById(sub)
    return { data: user }
  })

  app.patch('/me', {
    onRequest: [app.authenticate],
    schema: { tags: ['users'], summary: 'Atualizar perfil próprio', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest) => {
    const { sub } = request.user as JwtPayload
    const parsed = updateUserSchema.safeParse(request.body)
    if (!parsed.success) throw new ValidationError(parsed.error.flatten())

    // Não permite alterar is_active no próprio perfil
    const { is_active: _, ...safe } = parsed.data
    const user = await usersService.update(sub, safe)
    return { data: user }
  })

  app.post('/me/password', {
    onRequest: [app.authenticate],
    schema: { tags: ['users'], summary: 'Alterar senha', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply) => {
    const { sub } = request.user as JwtPayload
    const parsed = changePasswordSchema.safeParse(request.body)
    if (!parsed.success) throw new ValidationError(parsed.error.flatten())

    await usersService.changePassword(sub, parsed.data)
    return reply.status(204).send()
  })

  // ── Gestão de usuários (ADMIN) ─────────────────────────────────────────

  app.get('/', {
    onRequest: [app.authenticate, requireAdmin],
    schema: {
      tags: ['users'],
      summary: 'Listar usuários (ADMIN)',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page:      { type: 'integer', default: 1, minimum: 1 },
          limit:     { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          role:      { type: 'string', enum: ['TEACHER', 'PARENT', 'ADMIN'] },
          is_active: { type: 'boolean' },
          search:    { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest) => {
    const { sub } = request.user as JwtPayload
    const caller = await usersService.getById(sub)
    const q = request.query as { page?: number; limit?: number; role?: string; is_active?: boolean; search?: string }

    const { rows, total } = await usersService.list({
      school_id: caller.school_id ?? undefined,
      role:      q.role as any,
      is_active: q.is_active,
      search:    q.search,
      page:      q.page  ?? 1,
      limit:     q.limit ?? 20,
    })

    return {
      data: rows,
      meta: { total, page: q.page ?? 1, limit: q.limit ?? 20, pages: Math.ceil(total / (q.limit ?? 20)) },
    }
  })

  app.post('/', {
    onRequest: [app.authenticate, requireAdmin],
    schema: { tags: ['users'], summary: 'Criar usuário (ADMIN)', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply) => {
    const parsed = createUserSchema.safeParse(request.body)
    if (!parsed.success) throw new ValidationError(parsed.error.flatten())

    const user = await usersService.create(parsed.data)
    return reply.status(201).send({ data: user })
  })

  app.get('/:id', {
    onRequest: [app.authenticate, requireAdmin],
    schema: { tags: ['users'], summary: 'Buscar usuário por ID (ADMIN)', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string }
    const user = await usersService.getById(id)
    return { data: user }
  })

  app.patch('/:id', {
    onRequest: [app.authenticate, requireAdmin],
    schema: { tags: ['users'], summary: 'Atualizar usuário (ADMIN)', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest) => {
    const { id } = request.params as { id: string }
    const parsed = updateUserSchema.safeParse(request.body)
    if (!parsed.success) throw new ValidationError(parsed.error.flatten())

    const user = await usersService.update(id, parsed.data)
    return { data: user }
  })

  app.delete('/:id', {
    onRequest: [app.authenticate, requireAdmin],
    schema: { tags: ['users'], summary: 'Desativar usuário (ADMIN)', security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply) => {
    const { id } = request.params as { id: string }
    await usersService.deactivate(id)
    return reply.status(204).send()
  })
}
