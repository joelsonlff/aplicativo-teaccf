import { z } from 'zod'

export const createChildSchema = z.object({
  full_name:            z.string().min(2).max(200),
  birth_date:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  pin:                  z.string().length(4).regex(/^\d{4}$/, 'PIN deve ter 4 dígitos'),
  communication_level:  z.enum(['VERBAL', 'SEMI_VERBAL', 'NON_VERBAL']).default('VERBAL'),
  sensory_profile:      z.enum(['HYPERSENSITIVE', 'HYPOSENSITIVE', 'MIXED']).optional(),
  preferred_modalities: z.array(z.enum(['visual', 'auditory', 'tactile'])).default([]),
  notes:                z.string().max(2000).optional(),
  tea_profile:          z.record(z.unknown()).default({}),
})

export const updateChildSchema = z.object({
  full_name:            z.string().min(2).max(200).optional(),
  birth_date:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  communication_level:  z.enum(['VERBAL', 'SEMI_VERBAL', 'NON_VERBAL']).optional(),
  sensory_profile:      z.enum(['HYPERSENSITIVE', 'HYPOSENSITIVE', 'MIXED']).nullable().optional(),
  preferred_modalities: z.array(z.enum(['visual', 'auditory', 'tactile'])).optional(),
  notes:                z.string().max(2000).nullable().optional(),
  tea_profile:          z.record(z.unknown()).optional(),
  is_active:            z.boolean().optional(),
  avatar_url:           z.string().url().nullable().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Ao menos um campo é obrigatório' })

export const setPinSchema = z.object({
  pin: z.string().length(4).regex(/^\d{4}$/, 'PIN deve ter 4 dígitos'),
})

export type CreateChildInput = z.infer<typeof createChildSchema>
export type UpdateChildInput = z.infer<typeof updateChildSchema>
export type SetPinInput      = z.infer<typeof setPinSchema>
