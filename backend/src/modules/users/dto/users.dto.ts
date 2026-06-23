import { z } from 'zod'

export const createUserSchema = z.object({
  email:     z.string().email('Email inválido'),
  password:  z.string().min(8, 'Mínimo 8 caracteres').max(72),
  full_name: z.string().min(2).max(200),
  role:      z.enum(['TEACHER', 'PARENT', 'ADMIN']),
  phone:     z.string().max(20).optional(),
  school_id: z.string().uuid().optional(),
})

export const updateUserSchema = z.object({
  full_name:  z.string().min(2).max(200).optional(),
  phone:      z.string().max(20).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  is_active:  z.boolean().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Ao menos um campo é obrigatório' })

export const changePasswordSchema = z.object({
  current_password: z.string().min(8),
  new_password:     z.string().min(8).max(72),
})

export type CreateUserInput    = z.infer<typeof createUserSchema>
export type UpdateUserInput    = z.infer<typeof updateUserSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
