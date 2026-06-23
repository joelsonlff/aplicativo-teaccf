import { query } from '../../core/database/database'

export interface ExecutionRow {
  id: string
  assignment_id: string
  child_id: string
  started_at: Date
  completed_at: Date | null
  duration_seconds: number | null
  score: number | null
  accuracy: number | null
  attempts: number
  response_data: Record<string, unknown>
  behavioral_notes: string | null
  was_assisted: boolean
  device_info: Record<string, unknown>
  created_at: Date
}

export interface ProgressSummary {
  total_executions: number
  completed_executions: number
  average_score: number | null
  average_accuracy: number | null
  total_time_seconds: number
  domains: Record<string, { count: number; avg_score: number | null }>
  last_execution_at: Date | null
}

const COLS = `id, assignment_id, child_id, started_at, completed_at,
  duration_seconds, score, accuracy, attempts, response_data,
  behavioral_notes, was_assisted, device_info, created_at`

export class ExecutionsRepository {
  async findById(id: string): Promise<ExecutionRow | null> {
    const r = await query<ExecutionRow>(`SELECT ${COLS} FROM activity_executions WHERE id = $1`, [id])
    return r.rows[0] ?? null
  }

  async listByChild(childId: string, params: { page: number; limit: number }): Promise<{ rows: ExecutionRow[]; total: number }> {
    const offset = (params.page - 1) * params.limit
    const [cnt, rows] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*) FROM activity_executions WHERE child_id = $1`, [childId]),
      query<ExecutionRow>(
        `SELECT ${COLS} FROM activity_executions WHERE child_id = $1
         ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [childId, params.limit, offset],
      ),
    ])
    return { rows: rows.rows, total: Number(cnt.rows[0].count) }
  }

  async create(p: {
    assignment_id: string
    child_id: string
    started_at: string
    completed_at?: string
    duration_seconds?: number
    score?: number
    accuracy?: number
    attempts: number
    response_data: Record<string, unknown>
    behavioral_notes?: string
    was_assisted: boolean
    device_info: Record<string, unknown>
  }): Promise<ExecutionRow> {
    const r = await query<ExecutionRow>(
      `INSERT INTO activity_executions
         (assignment_id, child_id, started_at, completed_at, duration_seconds,
          score, accuracy, attempts, response_data, behavioral_notes, was_assisted, device_info)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING ${COLS}`,
      [
        p.assignment_id, p.child_id, p.started_at, p.completed_at ?? null,
        p.duration_seconds ?? null, p.score ?? null, p.accuracy ?? null,
        p.attempts, JSON.stringify(p.response_data),
        p.behavioral_notes ?? null, p.was_assisted, JSON.stringify(p.device_info),
      ],
    )
    return r.rows[0]
  }

  async progressSummary(childId: string): Promise<ProgressSummary> {
    const [totals, domains, lastExec] = await Promise.all([
      query<{
        total_executions: string
        completed_executions: string
        average_score: string | null
        average_accuracy: string | null
        total_time_seconds: string
      }>(
        `SELECT
           COUNT(*)                                          AS total_executions,
           COUNT(*) FILTER (WHERE completed_at IS NOT NULL) AS completed_executions,
           AVG(score)                                        AS average_score,
           AVG(accuracy)                                     AS average_accuracy,
           COALESCE(SUM(duration_seconds), 0)               AS total_time_seconds
         FROM activity_executions
        WHERE child_id = $1`,
        [childId],
      ),
      query<{ domain: string; count: string; avg_score: string | null }>(
        `SELECT a.domain, COUNT(ae.id) AS count, AVG(ae.score) AS avg_score
           FROM activity_executions ae
           JOIN activity_assignments aa ON aa.id = ae.assignment_id
           JOIN activities a ON a.id = aa.activity_id
          WHERE ae.child_id = $1
          GROUP BY a.domain`,
        [childId],
      ),
      query<{ created_at: Date }>(
        `SELECT created_at FROM activity_executions WHERE child_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [childId],
      ),
    ])

    const t = totals.rows[0]
    const domainMap: Record<string, { count: number; avg_score: number | null }> = {}
    for (const d of domains.rows) {
      domainMap[d.domain] = {
        count:     Number(d.count),
        avg_score: d.avg_score ? Number(d.avg_score) : null,
      }
    }

    return {
      total_executions:     Number(t.total_executions),
      completed_executions: Number(t.completed_executions),
      average_score:        t.average_score  ? Number(t.average_score)  : null,
      average_accuracy:     t.average_accuracy ? Number(t.average_accuracy) : null,
      total_time_seconds:   Number(t.total_time_seconds),
      domains:              domainMap,
      last_execution_at:    lastExec.rows[0]?.created_at ?? null,
    }
  }
}

export const executionsRepository = new ExecutionsRepository()
