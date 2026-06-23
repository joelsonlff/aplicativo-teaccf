import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { mediaService } from './media.service'
import type { JwtPayload } from '../../core/guards/roles.guard'
import { ForbiddenError } from '../../core/middleware/error-handler.middleware'

export async function mediaRoutes(app: FastifyInstance): Promise<void> {
  // POST /media/upload — professor faz upload de imagem para usar em símbolo CAA
  app.post('/upload', {
    onRequest: [app.authenticate],
    schema: {
      tags: ['media'],
      summary: 'Upload de imagem para símbolo CAA (professor)',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                url:          { type: 'string' },
                key:          { type: 'string' },
                content_type: { type: 'string' },
                size_bytes:   { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as JwtPayload
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new ForbiddenError('Apenas professores podem fazer upload de imagens')
    }

    const data = await request.file()
    if (!data) {
      return reply.status(400).send({
        error: { code: 'NO_FILE', message: 'Nenhum arquivo enviado' },
      })
    }

    const buffer = await data.toBuffer()
    const result = await mediaService.uploadImage(
      buffer,
      data.filename,
      data.mimetype,
      user.sub,
    )

    return reply.status(200).send({ data: result })
  })
}
