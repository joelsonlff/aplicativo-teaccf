import { z } from 'zod'

export const createAssignmentSchema = z.object({
  activity_id:   z.string().uuid(),
  child_id:      z.string().uuid(),
  due_date:      z.string().datetime({ offset: true }).optional(),
  order_index:   z.number().int().min(0).default(0),
  custom_params: z.record(z.unknown()).default({}),
  notes:         z.string().max(1000).optional(),
})

export const updateAssignmentSchema = z.object({
  status:       z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'SKIPPED']).optional(),
  due_date:     z.string().datetime({ offset: true }).nullable().optional(),
  order_index:  z.number().int().min(0).optional(),
  custom_params:z.record(z.unknown()).optional(),
  notes:        z.string().max(1000).nullable().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Ao menos um campo é obrigatório' })

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>
