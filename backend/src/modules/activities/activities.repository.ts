import { query } from '../../core/database/database'

export interface ActivityRow {
  id: string
  title: string
  description: string | null
  type: string
  domain: string
  difficulty: number
  duration_seconds: number
  instructions: string
  content: Record<string, unknown>
  media_urls: Record<string, unknown>
  tags: string[]
  is_template: boolean
  is_active: boolean
  created_by: string
  school_id: string | null
  created_at: Date
  updated_at: Date
}

interface CreateParams {
  title: string
  description?: string
  type: string
  domain: string
  difficulty: number
  duration_seconds: number
  instructions: string
  content: Record<string, unknown>
  media_urls: Record<string, unknown>
  tags: string[]
  is_template: boolean
  created_by: string
  school_id?: string | null
}

interface UpdateParams {
  title?: string
  description?: string | null
  difficulty?: number
  duration_seconds?: number
  instructions?: string
  content?: Record<string, unknown>
  media_urls?: Record<string, unknown>
  tags?: string[]
  is_template?: boolean
  is_active?: boolean
}

export interface ListActivitiesParams {
  created_by?: string
  school_id?: string
  type?: string
  domain?: string
  difficulty?: number
  is_template?: boolean
  is_active?: boolean
  search?: string
  page: number
  limit: number
}

const COLS = `id, title, description, type, domain, difficulty, duration_seconds,
  instructions, content, media_urls, tags, is_template, is_active,
  created_by, school_id, created_at, updated_at`

export class ActivitiesRepository {
  async findById(id: string): Promise<ActivityRow | null> {
    const r = await query<ActivityRow>(`SELECT ${COLS} FROM activities WHERE id = $1`, [id])
    return r.rows[0] ?? null
  }

  async list(p: ListActivitiesParams): Promise<{ rows: ActivityRow[]; total: number }> {
    const conds: string[] = ['is_active = true']
    const vals:  unknown[] = []
    let i = 1

    if (p.created_by)          { conds.push(`(created_by = $${i} OR is_template = true)`); vals.push(p.created_by); i++ }
    else if (p.school_id)      { conds.push(`(school_id = $${i} OR is_template = true)`);  vals.push(p.school_id);  i++ }
    if (p.type)                { conds.push(`type = $${i++}`);        vals.push(p.type) }
    if (p.domain)              { conds.push(`domain = $${i++}`);      vals.push(p.domain) }
    if (p.difficulty)          { conds.push(`difficulty = $${i++}`);  vals.push(p.difficulty) }
    if (p.is_template !== undefined){ conds.push(`is_template = $${i++}`); vals.push(p.is_template) }
    if (p.is_active !== undefined)  { conds[0] = `is_active = $${i++}`; vals.unshift(p.is_active) }
    if (p.search) {
      conds.push(
        `to_tsvector('portuguese', title || ' ' || COALESCE(description, '')) @@ plainto_tsquery('portuguese', $${i++})`
      )
      vals.push(p.search)
    }

    const where  = `WHERE ${conds.join(' AND ')}`
    const offset = (p.page - 1) * p.limit

    const [cnt, rows] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*) FROM activities ${where}`, vals),
      query<ActivityRow>(
        `SELECT ${COLS} FROM activities ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
        [...vals, p.limit, offset],
      ),
    ])

    return { rows: rows.rows, total: Number(cnt.rows[0].count) }
  }

  async create(p: CreateParams): Promise<ActivityRow> {
    const r = await query<ActivityRow>(
      `INSERT INTO activities
         (title, description, type, domain, difficulty, duration_seconds,
          instructions, content, media_urls, tags, is_template, created_by, school_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING ${COLS}`,
      [
        p.title, p.description ?? null, p.type, p.domain, p.difficulty, p.duration_seconds,
        p.instructions, JSON.stringify(p.content), JSON.stringify(p.media_urls),
        p.tags, p.is_template, p.created_by, p.school_id ?? null,
      ],
    )
    return r.rows[0]
  }

  async update(id: string, p: UpdateParams): Promise<ActivityRow | null> {
    const set: string[] = []
    const vals: unknown[] = []
    let i = 1

    if (p.title            !== undefined) { set.push(`title = $${i++}`);            vals.push(p.title) }
    if (p.description      !== undefined) { set.push(`description = $${i++}`);      vals.push(p.description) }
    if (p.difficulty       !== undefined) { set.push(`difficulty = $${i++}`);       vals.push(p.difficulty) }
    if (p.duration_seconds !== undefined) { set.push(`duration_seconds = $${i++}`); vals.push(p.duration_seconds) }
    if (p.instructions     !== undefined) { set.push(`instructions = $${i++}`);     vals.push(p.instructions) }
    if (p.content          !== undefined) { set.push(`content = $${i++}`);          vals.push(JSON.stringify(p.content)) }
    if (p.media_urls       !== undefined) { set.push(`media_urls = $${i++}`);       vals.push(JSON.stringify(p.media_urls)) }
    if (p.tags             !== undefined) { set.push(`tags = $${i++}`);             vals.push(p.tags) }
    if (p.is_template      !== undefined) { set.push(`is_template = $${i++}`);      vals.push(p.is_template) }
    if (p.is_active        !== undefined) { set.push(`is_active = $${i++}`);        vals.push(p.is_active) }

    if (!set.length) return this.findById(id)
    set.push(`updated_at = NOW()`)

    const r = await query<ActivityRow>(
      `UPDATE activities SET ${set.join(', ')} WHERE id = $${i} RETURNING ${COLS}`,
      [...vals, id],
    )
    return r.rows[0] ?? null
  }
}

export const activitiesRepository = new ActivitiesRepository()
