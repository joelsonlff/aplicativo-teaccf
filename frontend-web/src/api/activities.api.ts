import { apiClient } from './client'

export type ActivityType = 'MATCHING' | 'SEQUENCE' | 'EMOTION_RECOGNITION' | 'COMMUNICATION' | 'ROUTINE' | 'SOCIAL_STORY'
export type TeaDomain = 'COGNITIVE' | 'COMMUNICATION' | 'EMOTIONAL' | 'SOCIAL' | 'ROUTINE'

export interface ActivityRow {
  id: string
  title: string
  description: string | null
  type: ActivityType
  domain: TeaDomain
  difficulty: number
  duration_seconds: number
  instructions: string
  content: Record<string, unknown>
  tags: string[]
  is_template: boolean
  is_active: boolean
  created_by: string
  created_at: string
}

export interface CreateActivityInput {
  title: string
  description?: string
  type: ActivityType
  domain: TeaDomain
  difficulty: number
  duration_seconds: number
  instructions: string
  content: Record<string, unknown>
  tags?: string[]
  is_template?: boolean
}

export async function listActivities(params?: {
  domain?: TeaDomain
  type?: ActivityType
  search?: string
  page?: number
  limit?: number
}): Promise<{ data: ActivityRow[]; meta: { total: number } }> {
  const res = await apiClient.get<{ data: ActivityRow[]; meta: { total: number } }>('/activities', { params })
  return res.data
}

export async function getActivity(id: string): Promise<ActivityRow> {
  const res = await apiClient.get<{ data: ActivityRow }>(`/activities/${id}`)
  return res.data.data
}

export async function createActivity(input: CreateActivityInput): Promise<ActivityRow> {
  const res = await apiClient.post<{ data: ActivityRow }>('/activities', input)
  return res.data.data
}

export async function updateActivity(id: string, input: Partial<CreateActivityInput>): Promise<ActivityRow> {
  const res = await apiClient.patch<{ data: ActivityRow }>(`/activities/${id}`, input)
  return res.data.data
}

export async function deleteActivity(id: string): Promise<void> {
  await apiClient.delete(`/activities/${id}`)
}
