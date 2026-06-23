import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  createActivity, updateActivity, getActivity,
  type ActivityType, type TeaDomain,
} from '@api/activities.api'
import { Card } from '@shared/components/ui/Card'
import { Button } from '@shared/components/ui/Button'
import { Input } from '@shared/components/ui/Input'
import { Select } from '@shared/components/ui/Select'
import { Textarea } from '@shared/components/ui/Textarea'
import { PageSpinner } from '@shared/components/ui/Spinner'

const schema = z.object({
  title:            z.string().min(3, 'Título obrigatório (mín. 3 caracteres)'),
  description:      z.string().optional(),
  type:             z.enum(['MATCHING', 'SEQUENCE', 'EMOTION_RECOGNITION', 'COMMUNICATION', 'ROUTINE', 'SOCIAL_STORY']),
  domain:           z.enum(['COGNITIVE', 'COMMUNICATION', 'EMOTIONAL', 'SOCIAL', 'ROUTINE']),
  difficulty:       z.coerce.number().int().min(1).max(5),
  duration_seconds: z.coerce.number().int().min(30),
  instructions:     z.string().min(5, 'Instruções obrigatórias'),
  is_template:      z.boolean().default(false),
})
type FormData = z.infer<typeof schema>

const TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'MATCHING',            label: 'Associação (Matching)' },
  { value: 'SEQUENCE',            label: 'Sequência de Etapas' },
  { value: 'EMOTION_RECOGNITION', label: 'Reconhecimento Emocional' },
  { value: 'COMMUNICATION',       label: 'Comunicação (PECS-like)' },
  { value: 'ROUTINE',             label: 'Checklist de Rotina' },
  { value: 'SOCIAL_STORY',        label: 'História Social' },
]

const DOMAIN_OPTIONS: { value: TeaDomain; label: string }[] = [
  { value: 'COGNITIVE',     label: '🧠 Cognitivo' },
  { value: 'COMMUNICATION', label: '💬 Comunicação' },
  { value: 'EMOTIONAL',     label: '❤️ Emocional' },
  { value: 'SOCIAL',        label: '👫 Social' },
  { value: 'ROUTINE',       label: '📋 Rotina' },
]

const DIFFICULTY_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({
  value: String(n),
  label: `${'★'.repeat(n)} (Nível ${n})`,
}))

export function ActivityBuilderPage() {
  const { id }        = useParams<{ id?: string }>()
  const isEditing     = !!id
  const navigate      = useNavigate()
  const queryClient   = useQueryClient()

  const { data: existing, isLoading } = useQuery({
    queryKey: ['activity', id],
    queryFn:  () => getActivity(id!),
    enabled:  isEditing,
  })

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'MATCHING', domain: 'COGNITIVE', difficulty: 1, duration_seconds: 300, is_template: false,
    },
  })

  useEffect(() => {
    if (existing) {
      reset({
        title:            existing.title,
        description:      existing.description ?? '',
        type:             existing.type,
        domain:           existing.domain,
        difficulty:       existing.difficulty,
        duration_seconds: existing.duration_seconds,
        instructions:     existing.instructions,
        is_template:      existing.is_template,
      })
    }
  }, [existing, reset])

  const { mutateAsync: save } = useMutation({
    mutationFn: (data: FormData) =>
      isEditing
        ? updateActivity(id!, data)
        : createActivity({ ...data, content: buildDefaultContent(data.type) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      navigate('/activities')
    },
  })

  if (isEditing && isLoading) return <PageSpinner />

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/activities" className="hover:text-primary">Atividades</Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">{isEditing ? 'Editar' : 'Nova Atividade'}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Editar Atividade' : 'Criar Nova Atividade'}
      </h1>

      <form onSubmit={handleSubmit((d) => save(d))} className="flex flex-col gap-5">
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Informações Gerais</h2>
          <div className="flex flex-col gap-4">
            <Input label="Título" placeholder="Ex: Associar animais e sons" error={errors.title?.message} {...register('title')} />
            <Textarea label="Descrição (opcional)" placeholder="Breve descrição da atividade..." error={errors.description?.message} {...register('description')} />
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Tipo de atividade"
                    options={TYPE_OPTIONS as { value: string; label: string }[]}
                    error={errors.type?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="domain"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Domínio TEA"
                    options={DOMAIN_OPTIONS as { value: string; label: string }[]}
                    error={errors.domain?.message}
                    {...field}
                  />
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="difficulty"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Dificuldade"
                    options={DIFFICULTY_OPTIONS}
                    error={errors.difficulty?.message}
                    value={String(field.value)}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
              <Input
                label="Duração (segundos)"
                type="number"
                min={30}
                error={errors.duration_seconds?.message}
                {...register('duration_seconds')}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Instruções para a Criança</h2>
          <Textarea
            label="Instrução exibida antes da atividade"
            placeholder="Ex: Toque o animal e encontre o seu som correspondente."
            rows={4}
            error={errors.instructions?.message}
            {...register('instructions')}
          />
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Opções</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="rounded" {...register('is_template')} />
            <span className="text-sm text-gray-700">Tornar disponível como template para todos os professores</span>
          </label>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to="/activities">
            <Button type="button" variant="ghost">Cancelar</Button>
          </Link>
          <Button type="submit" loading={isSubmitting}>
            {isEditing ? 'Salvar alterações' : 'Criar atividade'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function buildDefaultContent(type: ActivityType): Record<string, unknown> {
  switch (type) {
    case 'MATCHING':
      return { pairs: [], allowRetries: true, maxRetries: 3, shuffleOnRetry: true }
    case 'SEQUENCE':
      return { steps: [], allowRetries: true }
    case 'EMOTION_RECOGNITION':
      return { scenario: { description: '' }, options: [], correctEmotionId: '' }
    default:
      return {}
  }
}
