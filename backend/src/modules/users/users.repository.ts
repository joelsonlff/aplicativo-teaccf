import { query } from '../../core/database/database'
import type { UserRole } from '../../core/guards/roles.guard'

export interface UserRow {
  id: string
  email: string
  password_hash: string
  full_name: string
  role: UserRole
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  email_verified: boolean
  school_id: string | null
  last_login_at: Date | null
  created_at: Date
  updated_at: Date
}

export type SafeUserRow = Omit<UserRow, 'password_hash'>

interface CreateParams {
  email: string
  password_hash: string
  full_name: string
  role: UserRole
  phone?: string
  school_id?: string
}

interface UpdateParams {
  full_name?:  string
  phone?:      string | null
  avatar_url?: string | null
  is_active?:  boolean
}

export interface ListParams {
  school_id?: string
  role?:      UserRole
  is_active?: boolean
  search?:    string
  page:       number
  limit:      number
}

const SAFE_COLS = `id, email, full_name, role, phone, avatar_url,
  is_active, email_verified, school_id, last_login_at, created_at, updated_at`

export class UsersRepository {
  async findById(id: string): Promise<SafeUserRow | null> {
    const r = await query<SafeUserRow>(`SELECT ${SAFE_COLS} FROM users WHERE id = $1`, [id])
    return r.rows[0] ?? null
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const r = await query<UserRow>(
      `SELECT id, email, password_hash, full_name, role, phone, avatar_url,
              is_active, email_verified, school_id, last_login_at, created_at, updated_at
         FROM users WHERE email = $1 LIMIT 1`,
      [email],
    )
    return r.rows[0] ?? null
  }

  async list(p: ListParams): Promise<{ rows: SafeUserRow[]; total: number }> {
    const conds: string[] = []
    const vals:  unknown[] = []
    let i = 1

    if (p.school_id)           { conds.push(`school_id = $${i++}`);    vals.push(p.school_id) }
    if (p.role)                { conds.push(`role = $${i++}`);         vals.push(p.role) }
    if (p.is_active !== undefined){ conds.push(`is_active = $${i++}`); vals.push(p.is_active) }
    if (p.search) {
      conds.push(`(full_name ILIKE $${i} OR email ILIKE $${i})`)
      vals.push(`%${p.search}%`)
      i++
    }

    const where  = conds.length ? `WHERE ${conds.join(' AND ')}` : ''
    const offset = (p.page - 1) * p.limit

    const [cnt, rows] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*) FROM users ${where}`, vals),
      query<SafeUserRow>(
        `SELECT ${SAFE_COLS} FROM users ${where}
         ORDER BY full_name ASC LIMIT $${i} OFFSET $${i + 1}`,
        [...vals, p.limit, offset],
      ),
    ])

    return { rows: rows.rows, total: Number(cnt.rows[0].count) }
  }

  async create(p: CreateParams): Promise<SafeUserRow> {
    const r = await query<SafeUserRow>(
      `INSERT INTO users (email, password_hash, full_name, role, phone, school_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING ${SAFE_COLS}`,
      [p.email, p.password_hash, p.full_name, p.role, p.phone ?? null, p.school_id ?? null],
    )
    return r.rows[0]
  }

  async update(id: string, p: UpdateParams): Promise<SafeUserRow | null> {
    const set: string[] = []
    const vals: unknown[] = []
    let i = 1

    if (p.full_name  !== undefined) { set.push(`full_name = $${i++}`);  vals.push(p.full_name) }
    if (p.phone      !== undefined) { set.push(`phone = $${i++}`);      vals.push(p.phone) }
    if (p.avatar_url !== undefined) { set.push(`avatar_url = $${i++}`); vals.push(p.avatar_url) }
    if (p.is_active  !== undefined) { set.push(`is_active = $${i++}`);  vals.push(p.is_active) }

    if (!set.length) return this.findById(id)
    set.push(`updated_at = NOW()`)

    const r = await query<SafeUserRow>(
      `UPDATE users SET ${set.join(', ')} WHERE id = $${i} RETURNING ${SAFE_COLS}`,
      [...vals, id],
    )
    return r.rows[0] ?? null
  }

  async updatePassword(id: string, hash: string): Promise<void> {
    await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [hash, id])
  }

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const r = await query<{ count: string }>(
      `SELECT COUNT(*) FROM users WHERE email = $1${excludeId ? ' AND id != $2' : ''}`,
      excludeId ? [email, excludeId] : [email],
    )
    return Number(r.rows[0].count) > 0
  }
}

export const usersRepository = new UsersRepository()
