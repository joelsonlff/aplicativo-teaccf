import type { FastifyReply, FastifyRequest } from 'fastify'
import { ForbiddenError, UnauthorizedError } from '../middleware/error-handler.middleware'

export type UserRole = 'TEACHER' | 'PARENT' | 'CHILD' | 'ADMIN'

export interface JwtPayload {
  sub: string
  role: UserRole
  school_id?: string
  iat: number
  exp: number
}

export interface ChildJwtPayload {
  sub: string
  type: 'child'
  iat: number
  exp: number
}

// Decorator de rota — verifica se o usuário tem uma das roles permitidas
export function requireRoles(...roles: UserRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const user = request.user as JwtPayload | undefined

    if (!user) {
      throw new UnauthorizedError()
    }

    if (!roles.includes(user.role)) {
      throw new ForbiddenError(
        `Acesso restrito. Perfil necessário: ${roles.join(' ou ')}`
      )
    }
  }
}

// Verifica se é TEACHER
export async function requireTeacher(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  return requireRoles('TEACHER')(request, reply)
}

// Verifica se é PARENT
export async function requireParent(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  return requireRoles('PARENT')(request, reply)
}

// Verifica se é TEACHER ou PARENT
export async function requireAdultUser(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  return requireRoles('TEACHER', 'PARENT')(request, reply)
}

// Verifica se é ADMIN
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  return requireRoles('ADMIN')(request, reply)
}

// Verifica se é uma criança autenticada via child token (type: 'child')
export async function requireChild(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const user = request.user as (JwtPayload | ChildJwtPayload) | undefined
  if (!user) throw new UnauthorizedError()
  if ((user as ChildJwtPayload).type !== 'child') {
    throw new ForbiddenError('Rota exclusiva para crianças')
  }
}
