import { clsx } from 'clsx'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger:  'bg-red-100 text-red-700',
  info:    'bg-blue-100 text-blue-800',
  brand:   'bg-brand/10 text-brand',
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function statusBadge(status: string): BadgeVariant {
  switch (status) {
    case 'COMPLETED': return 'success'
    case 'IN_PROGRESS': return 'info'
    case 'PENDING': return 'warning'
    case 'EXPIRED': return 'danger'
    default: return 'default'
  }
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'Pendente', IN_PROGRESS: 'Em andamento',
    COMPLETED: 'Concluído', EXPIRED: 'Expirado', SKIPPED: 'Pulado',
  }
  return map[status] ?? status
}
