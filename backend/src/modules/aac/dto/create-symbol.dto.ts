import { z } from 'zod'

export const createSymbolSchema = z.object({
  child_id: z.string().uuid().nullable().default(null),
  label: z.string().min(1).max(100).transform((v) => v.trim().toUpperCase()),
  image_url: z.string().url('URL da imagem inválida'),
  category_id: z.string().min(1).max(50).default('teacher'),
  sort_order: z.number().int().min(0).max(999).default(0),
})

export type CreateSymbolInput = z.infer<typeof createSymbolSchema>
