import { aacRepository, type AACRepository, type AACSymbolRow } from './aac.repository'
import { createSymbolSchema } from './dto/create-symbol.dto'
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../core/middleware/error-handler.middleware'

export interface AACSymbolDTO {
  id: string
  child_id: string | null
  label: string
  image_url: string
  category_id: string
  sort_order: number
  created_at: Date
}

function toDTO(row: AACSymbolRow): AACSymbolDTO {
  return {
    id: row.id,
    child_id: row.child_id,
    label: row.label,
    image_url: row.image_url,
    category_id: row.category_id,
    sort_order: row.sort_order,
    created_at: row.created_at,
  }
}

export class AACService {
  constructor(private readonly repo: AACRepository) {}

  async getSymbolsForChild(childId: string): Promise<AACSymbolDTO[]> {
    const rows = await this.repo.findByChild(childId)
    return rows.map(toDTO)
  }

  async getSymbolsByTeacher(teacherId: string): Promise<AACSymbolDTO[]> {
    const rows = await this.repo.findByTeacher(teacherId)
    return rows.map(toDTO)
  }

  async addSymbol(input: unknown, teacherId: string): Promise<AACSymbolDTO> {
    const parsed = createSymbolSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.flatten())

    const row = await this.repo.create({
      ...parsed.data,
      created_by: teacherId,
    })

    return toDTO(row)
  }

  async removeSymbol(symbolId: string, teacherId: string): Promise<void> {
    const symbol = await this.repo.findById(symbolId)
    if (!symbol) throw new NotFoundError('Símbolo CAA', symbolId)
    if (symbol.created_by !== teacherId) {
      throw new ForbiddenError('Você não pode remover um símbolo criado por outro professor')
    }

    await this.repo.deactivate(symbolId)
  }
}

export const aacService = new AACService(aacRepository)
