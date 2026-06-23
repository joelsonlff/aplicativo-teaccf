import { z } from 'zod'

export const createActivitySchema = z.object({
  title:            z.string().min(3).max(200),
  description:      z.string().max(2000).optional(),
  type:             z.enum(['MATCHING', 'SEQUENCE', 'EMOTION_RECOGNITION', 'COMMUNICATION', 'ROUTINE', 'SOCIAL_STORY']),
  domain:           z.enum(['COGNITIVE', 'COMMUNICATION', 'EMOTIONAL', 'SOCIAL', 'ROUTINE']),
  difficulty:       z.number().int().min(1).max(5),
  duration_seconds: z.number().int().min(30).max(3600),
  instructions:     z.string().min(10),
  content:          z.record(z.unknown()),
  media_urls:       z.record(z.unknown()).default({}),
  tags:             z.array(z.string().max(50)).default([]),
  is_template:      z.boolean().default(false),
})

export const updateActivitySchema = z.object({
  title:            z.string().min(3).max(200).optional(),
  description:      z.string().max(2000).nullable().optional(),
  difficulty:       z.number().int().min(1).max(5).optional(),
  duration_seconds: z.number().int().min(30).max(3600).optional(),
  instructions:     z.string().min(10).optional(),
  content:          z.record(z.unknown()).optional(),
  media_urls:       z.record(z.unknown()).optional(),
  tags:             z.array(z.string().max(50)).optional(),
  is_template:      z.boolean().optional(),
  is_active:        z.boolean().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Ao menos um campo é obrigatório' })

export type CreateActivityInput = z.infer<typeof createActivitySchema>
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>
