import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { aacService } from './aac.service'
import type { JwtPayload } from '../../core/guards/roles.guard'
import { ForbiddenError, ValidationError } from '../../core/middleware/error-handler.middleware'
import { z } from 'zod'

export async function aacRoutes(app: FastifyInstance): Promise<void> {
  // GET /aac/symbols?child_id=... — app da criança, professor ou responsável
  app.get('/symbols', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['aac'],
      summary: 'Listar símbolos CAA do professor para uma criança',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['child_id'],
        properties: { child_id: { type: 'string', format: 'uuid' } },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = z.object({ child_id: z.string().uuid() }).safeParse(request.query)
    if (!parsed.success) throw new ValidationError(parsed.error.flatten())

    const symbols = await aacService.getSymbolsForChild(parsed.data.child_id)
    return reply.status(200).send({ data: symbols })
  })

  // GET /aac/symbols/my — professor vê todos seus símbolos
  app.get('/symbols/my', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['aac'],
      summary: 'Listar todos os símbolos criados pelo professor autenticado',
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as JwtPayload
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new ForbiddenError('Apenas professores podem acessar esta rota')
    }

    const symbols = await aacService.getSymbolsByTeacher(user.sub)
    return reply.status(200).send({ data: symbols })
  })

  // POST /aac/symbols — professor cria novo símbolo
  app.post('/symbols', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['aac'],
      summary: 'Criar símbolo CAA para uma criança (professor)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['label', 'image_url'],
        properties: {
          child_id:    { type: 'string', format: 'uuid', nullable: true },
          label:       { type: 'string', maxLength: 100 },
          image_url:   { type: 'string', format: 'uri' },
          category_id: { type: 'string', default: 'teacher' },
          sort_order:  { type: 'number', default: 0 },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as JwtPayload
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new ForbiddenError('Apenas professores podem criar símbolos CAA')
    }

    const symbol = await aacService.addSymbol(request.body, user.sub)
    return reply.status(201).send({ data: symbol })
  })

  // DELETE /aac/symbols/:id — professor remove símbolo
  app.delete('/symbols/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['aac'],
      summary: 'Remover símbolo CAA (professor)',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as JwtPayload
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new ForbiddenError('Apenas professores podem remover símbolos CAA')
    }

    const { id } = request.params as { id: string }
    await aacService.removeSymbol(id, user.sub)
    return reply.status(204).send()
  })
}
