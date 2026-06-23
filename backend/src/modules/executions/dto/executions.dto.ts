import { z } from 'zod'

export const createExecutionSchema = z.object({
  assignment_id:    z.string().uuid(),
  started_at:       z.string().datetime({ offset: true }),
  completed_at:     z.string().datetime({ offset: true }).optional(),
  duration_seconds: z.number().int().positive().optional(),
  attempts:         z.number().int().positive().default(1),
  response_data:    z.record(z.unknown()),   // raw data — score calculado no backend
  behavioral_notes: z.string().max(2000).optional(),
  was_assisted:     z.boolean().default(false),
  device_info:      z.record(z.unknown()).default({}),
})

export type CreateExecutionInput = z.infer<typeof createExecutionSchema>
