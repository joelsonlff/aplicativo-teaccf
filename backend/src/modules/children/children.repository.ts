import { query } from '../../core/database/database'

export interface ChildRow {
  id: string
  full_name: string
  birth_date: Date
  avatar_url: string | null
  communication_level: string
  sensory_profile: string | null
  preferred_modalities: string[]
  notes: string | null
  tea_profile: Record<string, unknown>
  is_active: boolean
  created_by: string
  school_id: string | null
  created_at: Date
  updated_at: Date
}

interface CreateParams {
  full_name: string
  birth_date: string
  pin_hash: string
  communication_level: string
  sensory_profile?: string
  preferred_modalities: string[]
  notes?: string
  tea_profile: Record<string, unknown>
  created_by: string
  school_id?: string | null
}

interface UpdateParams {
  full_name?: string
  birth_date?: string
  communication_level?: string
  sensory_profile?: string | null
  preferred_modalities?: string[]
  notes?: string | null
  tea_profile?: Record<string, unknown>
  is_active?: boolean
  avatar_url?: string | null
}

export interface ListChildrenParams {
  teacher_id?: string
  parent_id?: string
  school_id?: string
  is_active?: boolean
  search?: string
  page: number
  limit: number
}

const COLS = `c.id, c.full_name, c.birth_date, c.avatar_url, c.communication_level,
  c.sensory_profile, c.preferred_modalities, c.notes, c.tea_profile,
  c.is_active, c.created_by, c.school_id, c.created_at, c.updated_at`

export class ChildrenRepository {
  async findById(id: string): Promise<ChildRow | null> {
    const r = await query<ChildRow>(`SELECT ${COLS} FROM children c WHERE c.id = $1`, [id])
    return r.rows[0] ?? null
  }

  async list(p: ListChildrenParams): Promise<{ rows: ChildRow[]; total: number }> {
    const conds: string[] = ['1=1']
    const vals:  unknown[] = []
    let i = 1

    if (p.teacher_id) {
      conds.push(`EXISTS (SELECT 1 FROM teacher_children tc WHERE tc.child_id = c.id AND tc.teacher_id = $${i++})`)
      vals.push(p.teacher_id)
    }
    if (p.parent_id) {
      conds.push(`EXISTS (SELECT 1 FROM parent_children pc WHERE pc.child_id = c.id AND pc.parent_id = $${i++})`)
      vals.push(p.parent_id)
    }
    if (p.school_id)           { conds.push(`c.school_id = $${i++}`);    vals.push(p.school_id) }
    if (p.is_active !== undefined){ conds.push(`c.is_active = $${i++}`); vals.push(p.is_active) }
    if (p.search) {
      conds.push(`c.full_name ILIKE $${i++}`)
      vals.push(`%${p.search}%`)
    }

    const where  = `WHERE ${conds.join(' AND ')}`
    const offset = (p.page - 1) * p.limit

    const [cnt, rows] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*) FROM children c ${where}`, vals),
      query<ChildRow>(
        `SELECT ${COLS} FROM children c ${where} ORDER BY c.full_name ASC LIMIT $${i} OFFSET $${i + 1}`,
        [...vals, p.limit, offset],
      ),
    ])

    return { rows: rows.rows, total: Number(cnt.rows[0].count) }
  }

  async create(p: CreateParams): Promise<ChildRow> {
    const r = await query<ChildRow>(
      `INSERT INTO children
         (full_name, birth_date, pin_hash, communication_level, sensory_profile,
          preferred_modalities, notes, tea_profile, created_by, school_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING ${COLS.replace(/c\./g, '')}`,
      [
        p.full_name, p.birth_date, p.pin_hash,
        p.communication_level, p.sensory_profile ?? null,
        p.preferred_modalities, p.notes ?? null,
        JSON.stringify(p.tea_profile), p.created_by, p.school_id ?? null,
      ],
    )
    return r.rows[0]
  }

  async update(id: string, p: UpdateParams): Promise<ChildRow | null> {
    const set: string[] = []
    const vals: unknown[] = []
    let i = 1

    if (p.full_name             !== undefined) { set.push(`full_name = $${i++}`);             vals.push(p.full_name) }
    if (p.birth_date            !== undefined) { set.push(`birth_date = $${i++}`);            vals.push(p.birth_date) }
    if (p.communication_level   !== undefined) { set.push(`communication_level = $${i++}`);   vals.push(p.communication_level) }
    if (p.sensory_profile       !== undefined) { set.push(`sensory_profile = $${i++}`);       vals.push(p.sensory_profile) }
    if (p.preferred_modalities  !== undefined) { set.push(`preferred_modalities = $${i++}`);  vals.push(p.preferred_modalities) }
    if (p.notes                 !== undefined) { set.push(`notes = $${i++}`);                 vals.push(p.notes) }
    if (p.tea_profile           !== undefined) { set.push(`tea_profile = $${i++}`);           vals.push(JSON.stringify(p.tea_profile)) }
    if (p.is_active             !== undefined) { set.push(`is_active = $${i++}`);             vals.push(p.is_active) }
    if (p.avatar_url            !== undefined) { set.push(`avatar_url = $${i++}`);            vals.push(p.avatar_url) }

    if (!set.length) return this.findById(id)
    set.push(`updated_at = NOW()`)

    const r = await query<ChildRow>(
      `UPDATE children SET ${set.join(', ')} WHERE id = $${i} RETURNING ${COLS.replace(/c\./g, '')}`,
      [...vals, id],
    )
    return r.rows[0] ?? null
  }

  async updatePin(id: string, pinHash: string): Promise<void> {
    await query(`UPDATE children SET pin_hash = $1, updated_at = NOW() WHERE id = $2`, [pinHash, id])
  }

  async linkTeacher(teacherId: string, childId: string): Promise<void> {
    await query(
      `INSERT INTO teacher_children (teacher_id, child_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [teacherId, childId],
    )
  }

  async isTeacherLinked(teacherId: string, childId: string): Promise<boolean> {
    const r = await query<{ count: string }>(
      `SELECT COUNT(*) FROM teacher_children WHERE teacher_id = $1 AND child_id = $2`,
      [teacherId, childId],
    )
    return Number(r.rows[0].count) > 0
  }

  async isParentLinked(parentId: string, childId: string): Promise<boolean> {
    const r = await query<{ count: string }>(
      `SELECT COUNT(*) FROM parent_children WHERE parent_id = $1 AND child_id = $2`,
      [parentId, childId],
    )
    return Number(r.rows[0].count) > 0
  }
}

export const childrenRepository = new ChildrenRepository()
