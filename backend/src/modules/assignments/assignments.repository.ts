import { query } from '../../core/database/database'

export interface AssignmentRow {
  id: string
  activity_id: string
  child_id: string
  assigned_by: string
  status: string
  due_date: Date | null
  order_index: number
  custom_params: Record<string, unknown>
  notes: string | null
  assigned_at: Date
  completed_at: Date | null
  // Joined fields
  activity_title?: string
  activity_type?: string
  activity_domain?: string
  activity_difficulty?: number
  activity_duration_seconds?: number
}

interface CreateParams {
  activity_id: string
  child_id: string
  assigned_by: string
  due_date?: string
  order_index: number
  custom_params: Record<string, unknown>
  notes?: string
}

export interface ListByChildParams {
  status?: string
  page: number
  limit: number
}

const COLS = `aa.id, aa.activity_id, aa.child_id, aa.assigned_by, aa.status,
  aa.due_date, aa.order_index, aa.custom_params, aa.notes, aa.assigned_at, aa.completed_at,
  a.title AS activity_title, a.type AS activity_type, a.domain AS activity_domain,
  a.difficulty AS activity_difficulty, a.duration_seconds AS activity_duration_seconds`

export class AssignmentsRepository {
  async findById(id: string): Promise<AssignmentRow | null> {
    const r = await query<AssignmentRow>(
      `SELECT ${COLS}
         FROM activity_assignments aa
         JOIN activities a ON a.id = aa.activity_id
        WHERE aa.id = $1`,
      [id],
    )
    return r.rows[0] ?? null
  }

  async listByChild(childId: string, p: ListByChildParams): Promise<{ rows: AssignmentRow[]; total: number }> {
    const conds = [`aa.child_id = $1`]
    const vals: unknown[] = [childId]
    let i = 2

    if (p.status) { conds.push(`aa.status = $${i++}`); vals.push(p.status) }

    const where  = `WHERE ${conds.join(' AND ')}`

    const [cnt, rows] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) FROM activity_assignments aa ${where}`, vals
      ),
      query<AssignmentRow>(
        `SELECT ${COLS}
           FROM activity_assignments aa
           JOIN activities a ON a.id = aa.activity_id
          ${where}
          ORDER BY aa.order_index ASC, aa.assigned_at DESC
          LIMIT $${i} OFFSET $${i + 1}`,
        [...vals, p.limit, (p.page - 1) * p.limit],
      ),
    ])

    return { rows: rows.rows, total: Number(cnt.rows[0].count) }
  }

  async listByTeacher(teacherId: string, params: { child_id?: string; status?: string; page: number; limit: number }): Promise<{ rows: AssignmentRow[]; total: number }> {
    const conds = [`aa.assigned_by = $1`]
    const vals: unknown[] = [teacherId]
    let i = 2

    if (params.child_id) { conds.push(`aa.child_id = $${i++}`); vals.push(params.child_id) }
    if (params.status)   { conds.push(`aa.status = $${i++}`);   vals.push(params.status) }

    const where  = `WHERE ${conds.join(' AND ')}`
    const offset = (params.page - 1) * params.limit

    const [cnt, rows] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) FROM activity_assignments aa ${where}`, vals
      ),
      query<AssignmentRow>(
        `SELECT ${COLS}
           FROM activity_assignments aa
           JOIN activities a ON a.id = aa.activity_id
          ${where}
          ORDER BY aa.assigned_at DESC
          LIMIT $${i} OFFSET $${i + 1}`,
        [...vals, params.limit, offset],
      ),
    ])

    return { rows: rows.rows, total: Number(cnt.rows[0].count) }
  }

  async create(p: CreateParams): Promise<AssignmentRow> {
    const r = await query<AssignmentRow>(
      `INSERT INTO activity_assignments
         (activity_id, child_id, assigned_by, due_date, order_index, custom_params, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, activity_id, child_id, assigned_by, status, due_date, order_index, custom_params, notes, assigned_at, completed_at`,
      [
        p.activity_id, p.child_id, p.assigned_by,
        p.due_date ?? null, p.order_index,
        JSON.stringify(p.custom_params), p.notes ?? null,
      ],
    )
    return r.rows[0]
  }

  async update(id: string, p: { status?: string; due_date?: string | null; order_index?: number; custom_params?: Record<string, unknown>; notes?: string | null }): Promise<AssignmentRow | null> {
    const set: string[] = []
    const vals: unknown[] = []
    let i = 1

    if (p.status        !== undefined) {
      set.push(`status = $${i++}`)
      vals.push(p.status)
      if (p.status === 'COMPLETED') { set.push(`completed_at = NOW()`) }
    }
    if (p.due_date      !== undefined) { set.push(`due_date = $${i++}`);      vals.push(p.due_date) }
    if (p.order_index   !== undefined) { set.push(`order_index = $${i++}`);   vals.push(p.order_index) }
    if (p.custom_params !== undefined) { set.push(`custom_params = $${i++}`); vals.push(JSON.stringify(p.custom_params)) }
    if (p.notes         !== undefined) { set.push(`notes = $${i++}`);         vals.push(p.notes) }

    if (!set.length) return this.findById(id)

    const r = await query<AssignmentRow>(
      `UPDATE activity_assignments SET ${set.join(', ')} WHERE id = $${i}
       RETURNING id, activity_id, child_id, assigned_by, status, due_date, order_index, custom_params, notes, assigned_at, completed_at`,
      [...vals, id],
    )
    return r.rows[0] ?? null
  }

  async delete(id: string): Promise<void> {
    await query(`DELETE FROM activity_assignments WHERE id = $1`, [id])
  }

  async childHasActivity(childId: string, activityId: string): Promise<boolean> {
    const r = await query<{ count: string }>(
      `SELECT COUNT(*) FROM activity_assignments WHERE child_id = $1 AND activity_id = $2`,
      [childId, activityId],
    )
    return Number(r.rows[0].count) > 0
  }
}

export const assignmentsRepository = new AssignmentsRepository()
