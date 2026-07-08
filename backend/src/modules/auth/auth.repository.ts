import { createHash } from 'crypto'
import { query } from '../../core/database/database'
import type { UserRole } from '../../core/guards/roles.guard'

export interface UserRow {
  id: string
  email: string
  password_hash: string
  full_name: string
  role: UserRole
  school_id: string | null
  is_active: boolean
}

export interface ChildRow {
  id: string
  full_name: string
  pin_hash: string
  is_active: boolean
}

interface StoreRefreshTokenParams {
  user_id: string
  raw_token: string  // hasheado com sha256 antes de persistir
  expires_at: Date
}

interface RefreshTokenRow {
  user_id: string
  expires_at: Date
  revoked_at: Date | null
}

export class AuthRepository {
  async findByEmail(email: string): Promise<UserRow | null> {
    const result = await query<UserRow>(
      `SELECT id, email, password_hash, full_name, role, school_id, is_active
         FROM users WHERE email = $1 LIMIT 1`,
      [email],
    )
    return result.rows[0] ?? null
  }

  async findById(userId: string): Promise<UserRow | null> {
    const result = await query<UserRow>(
      `SELECT id, email, password_hash, full_name, role, school_id, is_active
         FROM users WHERE id = $1 LIMIT 1`,
      [userId],
    )
    return result.rows[0] ?? null
  }

  async findChildById(childId: string): Promise<ChildRow | null> {
    const result = await query<ChildRow>(
      `SELECT id, full_name, pin_hash, is_active FROM children WHERE id = $1 LIMIT 1`,
      [childId],
    )
    return result.rows[0] ?? null
  }

  async updateLastLogin(userId: string): Promise<void> {
    await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [userId])
  }

  async storeRefreshToken(params: StoreRefreshTokenParams): Promise<void> {
    const hash = createHash('sha256').update(params.raw_token).digest('hex')
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [params.user_id, hash, params.expires_at],
    )
  }

  async findRefreshTokenByHash(rawToken: string): Promise<RefreshTokenRow | null> {
    const hash = createHash('sha256').update(rawToken).digest('hex')
    const result = await query<RefreshTokenRow>(
      `SELECT user_id, expires_at, revoked_at
         FROM refresh_tokens WHERE token_hash = $1 LIMIT 1`,
      [hash],
    )
    return result.rows[0] ?? null
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const hash = createHash('sha256').update(rawToken).digest('hex')
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`,
      [hash],
    )
  }
}

export const authRepository = new AuthRepository()
