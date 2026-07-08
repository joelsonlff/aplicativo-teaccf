import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authService } from './auth.service'
import { loginSchema, childLoginSchema, refreshSchema } from './dto/login.dto'
import { ValidationError } from '../../core/middleware/error-handler.middleware'
import { jwtConfig } from '../../config/app.config'

// Limites por IP mais rígidos que o global — logins são alvo de força bruta
// (o PIN da criança tem só 10.000 combinações)
const LOGIN_RATE_LIMIT = { max: 5, timeWindow: '1 minute' }

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // POST /auth/login — professor ou responsável
  app.post('/login', {
    config: { rateLimit: LOGIN_RATE_LIMIT },
    schema: {
      tags: ['auth'],
      summary: 'Login de professor ou responsável',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = loginSchema.safeParse(request.body)
    if (!parsed.success) throw new ValidationError(parsed.error.flatten())

    const { user, refreshToken } = await authService.validateUserCredentials(
      parsed.data.email,
      parsed.data.password,
    )

    const accessToken = app.jwt.sign(
      { sub: user.id, role: user.role, school_id: user.school_id },
      { expiresIn: jwtConfig.expiresIn },
    )

    return reply.status(200).send({
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 900, // 15 min em segundos
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          school_id: user.school_id,
        },
      },
    })
  })

  // POST /auth/child/login — login via PIN da criança
  app.post('/child/login', {
    config: { rateLimit: LOGIN_RATE_LIMIT },
    schema: {
      tags: ['auth'],
      summary: 'Login simplificado via PIN (criança)',
      body: {
        type: 'object',
        required: ['child_id', 'pin'],
        properties: {
          child_id: { type: 'string', format: 'uuid' },
          pin: { type: 'string', minLength: 4, maxLength: 4, pattern: '^[0-9]{4}$' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = childLoginSchema.safeParse(request.body)
    if (!parsed.success) throw new ValidationError(parsed.error.flatten())

    const { child } = await authService.validateChildPin(
      parsed.data.child_id,
      parsed.data.pin,
    )

    const childToken = app.jwt.sign(
      { sub: child.id, type: 'child' },
      { expiresIn: '8h' },
    )

    return reply.status(200).send({
      data: {
        child_token: childToken,
        expires_in: 28800, // 8h em segundos
        child: {
          id: child.id,
          full_name: child.full_name,
        },
      },
    })
  })

  // POST /auth/refresh — renovar access token
  app.post('/refresh', {
    schema: {
      tags: ['auth'],
      summary: 'Renovar access token usando refresh token',
      body: {
        type: 'object',
        required: ['refresh_token'],
        properties: { refresh_token: { type: 'string' } },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = refreshSchema.safeParse(request.body)
    if (!parsed.success) throw new ValidationError(parsed.error.flatten())

    const { user, refreshToken } = await authService.validateRefreshToken(parsed.data.refresh_token)

    const accessToken = app.jwt.sign(
      { sub: user.id, role: user.role, school_id: user.school_id },
      { expiresIn: jwtConfig.expiresIn },
    )

    return reply.status(200).send({
      data: { access_token: accessToken, refresh_token: refreshToken, expires_in: 900 },
    })
  })

  // POST /auth/logout — revogar refresh token
  app.post('/logout', {
    schema: { tags: ['auth'], summary: 'Encerrar sessão e revogar refresh token' },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = refreshSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(204).send()

    await authService.revokeRefreshToken(parsed.data.refresh_token)
    return reply.status(204).send()
  })
}
