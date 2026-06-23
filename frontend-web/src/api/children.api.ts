import { apiClient } from './client'

export interface ChildRow {
  id: string
  full_name: string
  birth_date: string
  avatar_url: string | null
  communication_level: string
  sensory_profile: string
  tea_profile: Record<string, unknown>
  notes: string | null
  is_active: boolean
  created_at: string
}

export interface CreateChildInput {
  full_name: string
  birth_date: string
  communication_level: 'VERBAL' | 'SEMI_VERBAL' | 'NON_VERBAL'
  sensory_profile: 'HYPERSENSITIVE' | 'HYPOSENSITIVE' | 'MIXED'
  notes?: string
  pin: string
}

export async function listChildren(params?: { page?: number; limit?: number }): Promise<{ data: ChildRow[]; meta: { total: number } }> {
  const res = await apiClient.get<{ data: ChildRow[]; meta: { total: number } }>('/children', { params })
  return res.data
}

export async function getChild(id: string): Promise<ChildRow> {
  const res = await apiClient.get<{ data: ChildRow }>(`/children/${id}`)
  return res.data.data
}

export async function createChild(input: CreateChildInput): Promise<ChildRow> {
  const res = await apiClient.post<{ data: ChildRow }>('/children', input)
  return res.data.data
}

export async function updateChild(id: string, input: Partial<Omit<CreateChildInput, 'pin'>>): Promise<ChildRow> {
  const res = await apiClient.patch<{ data: ChildRow }>(`/children/${id}`, input)
  return res.data.data
}

export async function setChildPin(id: string, pin: string): Promise<void> {
  await apiClient.post(`/children/${id}/pin`, { pin })
}
