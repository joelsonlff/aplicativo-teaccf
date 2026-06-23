import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { appConfig } from '../../config/app.config'

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, 'NOT_FOUND', id ? `${resource} com id '${id}' não encontrado` : `${resource} não encontrado`)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') {
    super(403, 'FORBIDDEN', message)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Autenticação necessária') {
    super(401, 'UNAUTHORIZED', message)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message)
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super(400, 'VALIDATION_ERROR', 'Dados de entrada inválidos', details)
  }
}

export function errorHandler(
  error: FastifyError | AppError | Error,
  _request: FastifyRequest,
  reply: FastifyReply
): void {
  // Erros de domínio tipados
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    })
    return
  }

  // Erros de validação do Fastify/schema
  const fastifyError = error as FastifyError
  if (fastifyError.validation) {
    reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados de entrada inválidos',
        details: fastifyError.validation,
      },
    })
    return
  }

  // Erro de JWT expirado
  if (error.message?.includes('TokenExpiredError')) {
    reply.status(401).send({ error: { code: 'TOKEN_EXPIRED', message: 'Token expirado' } })
    return
  }

  // Erro interno
  reply.status(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: appConfig.isDevelopment ? error.message : 'Erro interno do servidor',
    },
  })
}
