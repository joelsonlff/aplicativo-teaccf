import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { authRepository, type AuthRepository, type UserRow, type ChildRow } from './auth.repository'
import {
  UnauthorizedError,
  NotFoundError,
} from '../../core/middleware/error-handler.middleware'

export interface LoginResult {
  user: Omit<UserRow, 'password_hash'>
  refreshToken: string  // raw token — cliente armazena, nunca em DB
}

export interface ChildLoginResult {
  child: Omit<ChildRow, 'pin_hash'>
  // Token JWT assinado na camada de rota
}

export interface RefreshResult {
  user: Omit<UserRow, 'password_hash'>
}

export class AuthService {
  constructor(private readonly repo: AuthRepository) {}

  async validateUserCredentials(email: string, password: string): Promise<LoginResult> {
    const user = await this.repo.findByEmail(email)
    if (!user || !user.is_active) {
      throw new UnauthorizedError('Email ou senha inválidos')
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) {
      throw new UnauthorizedError('Email ou senha inválidos')
    }

    await this.repo.updateLastLogin(user.id)

    const refreshToken = randomBytes(32).toString('hex')
    await this.repo.storeRefreshToken({
      user_id: user.id,
      raw_token: refreshToken,   // o hash sha256 é feito no repository
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    const { password_hash: _, ...safeUser } = user
    return { user: safeUser, refreshToken }
  }

  async validateChildPin(childId: string, pin: string): Promise<ChildLoginResult> {
    const child = await this.repo.findChildById(childId)
    if (!child) throw new NotFoundError('Criança', childId)
    if (!child.is_active) throw new UnauthorizedError('Criança inativa')

    const pinMatch = await bcrypt.compare(pin, child.pin_hash)
    if (!pinMatch) throw new UnauthorizedError('PIN inválido')

    const { pin_hash: _, ...safeChild } = child
    return { child: safeChild }
  }

  async validateRefreshToken(rawToken: string): Promise<RefreshResult> {
    const stored = await this.repo.findRefreshTokenByHash(rawToken)

    if (!stored) throw new UnauthorizedError('Token inválido')
    if (stored.revoked_at) throw new UnauthorizedError('Token revogado')
    if (stored.expires_at < new Date()) throw new UnauthorizedError('Token expirado')

    const user = await this.repo.findById(stored.user_id)
    if (!user || !user.is_active) throw new UnauthorizedError('Usuário inativo')

    const { password_hash: _, ...safeUser } = user
    return { user: safeUser }
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    await this.repo.revokeRefreshToken(rawToken)
  }
}

export const authService = new AuthService(authRepository)
