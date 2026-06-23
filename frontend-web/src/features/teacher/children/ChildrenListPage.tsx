import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { listChildren, createChild, type ChildRow } from '@api/children.api'
import { Card } from '@shared/components/ui/Card'
import { Button } from '@shared/components/ui/Button'
import { Input } from '@shared/components/ui/Input'
import { Select } from '@shared/components/ui/Select'
import { PageSpinner } from '@shared/components/ui/Spinner'

const schema = z.object({
  full_name:             z.string().min(2, 'Nome obrigatório'),
  birth_date:            z.string().min(1, 'Data obrigatória'),
  communication_level:   z.enum(['VERBAL', 'SEMI_VERBAL', 'NON_VERBAL']),
  sensory_profile:       z.enum(['HYPERSENSITIVE', 'HYPOSENSITIVE', 'MIXED']),
  pin:                   z.string().length(4).regex(/^\d{4}$/, 'PIN deve ter 4 dígitos'),
  notes:                 z.string().optional(),
})
type FormData = z.infer<typeof schema>

const COMM_OPTS = [
  { value: 'VERBAL',      label: 'Verbal' },
  { value: 'SEMI_VERBAL', label: 'Semi-Verbal' },
  { value: 'NON_VERBAL',  label: 'Não-Verbal' },
]
const SENSORY_OPTS = [
  { value: 'HYPERSENSITIVE', label: 'Hipersensível' },
  { value: 'HYPOSENSITIVE',  label: 'Hipossensível' },
  { value: 'MIXED',          label: 'Misto' },
]

function ChildCard({ child }: { child: ChildRow }) {
  return (
    <Link to={`/children/${child.id}`}>
      <Card className="flex items-center gap-4 hover:border-primary transition-colors cursor-pointer">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary-dark shrink-0">
          {child.full_name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{child.full_name}</p>
          <p className="text-sm text-gray-500">{child.communication_level.replace('_', '-')}</p>
        </div>
        <span className="text-gray-300">›</span>
      </Card>
    </Link>
  )
}

export function ChildrenListPage() {
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['children'],
    queryFn: () => listChildren({ limit: 50 }),
  })

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] })
      setShowForm(false)
      reset()
    },
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { communication_level: 'VERBAL', sensory_profile: 'MIXED' },
  })

  if (isLoading) return <PageSpinner />

  const children = data?.data ?? []

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alunos</h1>
          <p className="text-sm text-gray-500">{data?.meta.total ?? 0} cadastrados</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : '+ Novo Aluno'}
        </Button>
      </div>

      {/* Formulário de cadastro */}
      {showForm && (
        <Card className="mb-6">
          <h2 className="text-base font-semibold mb-4">Cadastrar Aluno</h2>
          <form
            onSubmit={handleSubmit((d) => mutateAsync(d))}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <Input label="Nome completo" error={errors.full_name?.message} {...register('full_name')} className="sm:col-span-2" />
            <Input label="Data de nascimento" type="date" error={errors.birth_date?.message} {...register('birth_date')} />
            <Input label="PIN (4 dígitos)" maxLength={4} placeholder="1234" error={errors.pin?.message} {...register('pin')} />
            <Select label="Nível de comunicação" options={COMM_OPTS} error={errors.communication_level?.message} {...register('communication_level')} />
            <Select label="Perfil sensorial" options={SENSORY_OPTS} error={errors.sensory_profile?.message} {...register('sensory_profile')} />
            <Input label="Observações (opcional)" error={errors.notes?.message} {...register('notes')} className="sm:col-span-2" />
            <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" loading={isPending}>Cadastrar</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista */}
      <div className="flex flex-col gap-3">
        {children.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">👧</p>
            <p className="text-gray-500">Nenhum aluno cadastrado ainda.</p>
          </div>
        )}
        {children.map((child) => <ChildCard key={child.id} child={child} />)}
      </div>
    </div>
  )
}
