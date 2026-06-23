import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
})

export const childLoginSchema = z.object({
  child_id: z.string().uuid('child_id deve ser um UUID válido'),
  pin: z.string().regex(/^\d{4}$/, 'PIN deve ter exatamente 4 dígitos'),
})

export const refreshSchema = z.object({
  refresh_token: z.string().min(10, 'Token inválido'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type ChildLoginInput = z.infer<typeof childLoginSchema>
export type RefreshInput = z.infer<typeof refreshSchema>
