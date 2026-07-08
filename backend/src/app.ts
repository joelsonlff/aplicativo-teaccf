import Fastify, { type FastifyRequest, type FastifyReply } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import fastifyJwt from '@fastify/jwt'
import fastifyMultipart from '@fastify/multipart'
import { appConfig, corsConfig, jwtConfig } from './config/app.config'
import { connectDatabase } from './core/database/database'
import { UnauthorizedError, errorHandler } from './core/middleware/error-handler.middleware'
import { authRoutes } from './modules/auth/auth.routes'
import { mediaRoutes } from './modules/media/media.routes'
import { aacRoutes } from './modules/aac/aac.routes'
import { usersRoutes } from './modules/users/users.routes'
import { childrenRoutes } from './modules/children/children.routes'
import { activitiesRoutes } from './modules/activities/activities.routes'
import { assignmentsRoutes } from './modules/assignments/assignments.routes'
import { executionsRoutes } from './modules/executions/executions.routes'
import { aiRoutes } from './modules/ai/ai.routes'

// Extensão de tipos para o decorator authenticate
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

const app = Fastify({
  logger: {
    level: appConfig.logLevel,
    ...(appConfig.isDevelopment && {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss' },
      },
    }),
  },
  genReqId: () => crypto.randomUUID(),
})

async function registerPlugins() {
  await app.register(helmet, { contentSecurityPolicy: false })

  await app.register(cors, {
    origin: appConfig.isDevelopment
      ? true
      : [
          'https://app.coracaofeliz.com.br',
          'https://professor.coracaofeliz.com.br',
          ...corsConfig.origins,
        ],
    credentials: true,
  })

  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Muitas requisições. Tente novamente em 1 minuto.',
      },
    }),
  })

  // JWT — access tokens (15 min)
  await app.register(fastifyJwt, { secret: jwtConfig.secret })

  // Decorator para proteger rotas: onRequest: [app.authenticate]
  app.decorate('authenticate', async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch {
      throw new UnauthorizedError('Token inválido ou ausente')
    }
  })

  // Multipart — upload de arquivos (máx 5 MB)
  await app.register(fastifyMultipart, {
    limits: { fileSize: 5 * 1024 * 1024 },
  })

  await app.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'TEA Platform API',
        description: 'API da plataforma educacional para crianças com TEA — Coração Feliz',
        version: '1.0.0',
        contact: { email: 'joelson@coracaofeliz.com' },
      },
      servers: [{ url: `http://localhost:${appConfig.port}`, description: 'Desenvolvimento' }],
      tags: [
        { name: 'auth',        description: 'Autenticação' },
        { name: 'users',       description: 'Usuários' },
        { name: 'children',    description: 'Crianças' },
        { name: 'activities',  description: 'Atividades' },
        { name: 'assignments', description: 'Atribuições' },
        { name: 'executions',  description: 'Execuções' },
        { name: 'aac',         description: 'CAA — Comunicação Aumentativa e Alternativa' },
        { name: 'media',       description: 'Upload de mídia' },
        { name: 'progress',    description: 'Progresso' },
        { name: 'ai',          description: 'IA Adaptativa (Gemini)' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list' },
  })
}

async function registerRoutes() {
  app.get('/health', { schema: { tags: ['system'] } }, async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }))

  await app.register(authRoutes,        { prefix: '/api/v1/auth' })
  await app.register(mediaRoutes,       { prefix: '/api/v1/media' })
  await app.register(aacRoutes,         { prefix: '/api/v1/aac' })
  await app.register(usersRoutes,       { prefix: '/api/v1/users' })
  await app.register(childrenRoutes,    { prefix: '/api/v1/children' })
  await app.register(activitiesRoutes,  { prefix: '/api/v1/activities' })
  await app.register(assignmentsRoutes, { prefix: '/api/v1/assignments' })
  await app.register(executionsRoutes,  { prefix: '/api/v1/executions' })
  await app.register(aiRoutes,          { prefix: '/api/v1/ai' })
}

app.setErrorHandler((error, request, reply) => {
  app.log.error(error)

  if (error.statusCode === 429) {
    return reply.status(429).send({ error: { code: 'RATE_LIMIT_EXCEEDED', message: error.message } })
  }

  return errorHandler(error, request, reply)
})

async function start() {
  try {
    await connectDatabase()
    await registerPlugins()
    await registerRoutes()

    await app.listen({ port: appConfig.port, host: appConfig.host })
    app.log.info(`Documentação disponível em http://localhost:${appConfig.port}/docs`)
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

start()

export { app }
