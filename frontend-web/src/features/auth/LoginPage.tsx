import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { login } from '@api/auth.api'
import { useAuthStore } from '@app/store/auth.store'
import { Button } from '@shared/components/ui/Button'
import { Input } from '@shared/components/ui/Input'

const schema = z.object({
  email:    z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate    = useNavigate()
  const location    = useLocation()
  const setTokens   = useAuthStore((s) => s.setTokens)
  const setUser     = useAuthStore((s) => s.setUser)
  const from        = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    try {
      const res = await login(data.email, data.password)
      setTokens(res.access_token, res.refresh_token)
      setUser({
        id: res.user.id,
        email: res.user.email,
        fullName: res.user.full_name,
        role: res.user.role as 'TEACHER' | 'PARENT' | 'ADMIN',
        schoolId: res.user.school_id,
      })
      navigate(from, { replace: true })
    } catch {
      setError('root', { message: 'E-mail ou senha incorretos.' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand mb-4">
            <span className="text-2xl text-white font-bold">CF</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Coração Feliz</h1>
          <p className="text-sm text-gray-500 mt-1">Plataforma TEA — Acesso Educacional</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-surface rounded-xl border border-border shadow-sm p-6 flex flex-col gap-4">
          <Input
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="professor@escola.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Senha"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          {errors.root && (
            <p className="text-sm text-danger text-center">{errors.root.message}</p>
          )}

          <Button type="submit" size="lg" loading={isSubmitting} className="w-full mt-2">
            Entrar
          </Button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          joelson@coracaofeliz.com
        </p>
      </div>
    </div>
  )
}
