import type { FastifyInstance, FastifyRequest } from 'fastify'
import { aiService } from './ai.service'
import { requireAdultUser } from '../../core/guards/roles.guard'
import type { JwtPayload } from '../../core/guards/roles.guard'

export async function aiRoutes(app: FastifyInstance): Promise<void> {
  // GET /ai/recommendations/:childId
  // Professor recebe sugestões de atividades personalizadas para a criança
  app.get('/recommendations/:childId', {
    onRequest: [app.authenticate, requireAdultUser],
    schema: {
      tags:     ['ai'],
      summary:  'Recomendar atividades para uma criança (IA)',
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest) => {
    const { childId } = request.params as { childId: string }
    const { sub }     = request.user as JwtPayload
    const recommendations = await aiService.recommendActivities(childId, sub)
    return { data: recommendations }
  })

  // GET /ai/progress-report/:childId
  // Gera relatório de progresso em linguagem natural
  app.get('/progress-report/:childId', {
    onRequest: [app.authenticate, requireAdultUser],
    schema: {
      tags:     ['ai'],
      summary:  'Gerar relatório de progresso em linguagem natural (IA)',
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest) => {
    const { childId } = request.params as { childId: string }
    const report = await aiService.generateProgressReport(childId)
    return { data: report }
  })
}
