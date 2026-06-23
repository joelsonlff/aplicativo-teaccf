import { query } from '../../core/database/database'

export interface AACSymbolRow {
  id: string
  child_id: string | null
  created_by: string
  label: string
  image_url: string
  category_id: string
  sort_order: number
  is_active: boolean
  created_at: Date
}

export class AACRepository {
  async findByChild(childId: string): Promise<AACSymbolRow[]> {
    const result = await query<AACSymbolRow>(
      `SELECT id, child_id, created_by, label, image_url, category_id, sort_order, is_active, created_at
         FROM aac_symbols
        WHERE is_active = true
          AND (child_id = $1 OR child_id IS NULL)
        ORDER BY sort_order ASC, created_at ASC`,
      [childId],
    )
    return result.rows
  }

  async findByTeacher(teacherId: string): Promise<AACSymbolRow[]> {
    const result = await query<AACSymbolRow>(
      `SELECT id, child_id, created_by, label, image_url, category_id, sort_order, is_active, created_at
         FROM aac_symbols
        WHERE created_by = $1 AND is_active = true
        ORDER BY child_id, sort_order ASC`,
      [teacherId],
    )
    return result.rows
  }

  async findById(symbolId: string): Promise<AACSymbolRow | null> {
    const result = await query<AACSymbolRow>(
      `SELECT id, child_id, created_by, label, image_url, category_id, sort_order, is_active, created_at
         FROM aac_symbols WHERE id = $1 LIMIT 1`,
      [symbolId],
    )
    return result.rows[0] ?? null
  }

  async create(data: {
    child_id: string | null
    created_by: string
    label: string
    image_url: string
    category_id: string
    sort_order: number
  }): Promise<AACSymbolRow> {
    const result = await query<AACSymbolRow>(
      `INSERT INTO aac_symbols (child_id, created_by, label, image_url, category_id, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, child_id, created_by, label, image_url, category_id, sort_order, is_active, created_at`,
      [
        data.child_id,
        data.created_by,
        data.label,
        data.image_url,
        data.category_id,
        data.sort_order,
      ],
    )
    return result.rows[0]!
  }

  async deactivate(symbolId: string): Promise<void> {
    await query(
      `UPDATE aac_symbols SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [symbolId],
    )
  }
}

export const aacRepository = new AACRepository()
