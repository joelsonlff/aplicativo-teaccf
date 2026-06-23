import { apiClient } from './client'

export type AssignmentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'SKIPPED'

export interface AssignmentRow {
  id: string
  activity_id: string
  child_id: string
  assigned_by: string
  status: AssignmentStatus
  due_date: string | null
  order_index: number
  notes: string | null
  assigned_at: string
  completed_at: string | null
  activity_title: string
  activity_type: string
  activity_domain: string
  activity_difficulty: number
}

export interface CreateAssignmentInput {
  activity_id: string
  child_id: string
  due_date?: string
  order_index: number
  notes?: string
  custom_params?: Record<string, unknown>
}

export async function listAssignments(params?: {
  child_id?: string
  status?: AssignmentStatus
  page?: number
  limit?: number
}): Promise<{ data: AssignmentRow[]; meta: { total: number } }> {
  const res = await apiClient.get<{ data: AssignmentRow[]; meta: { total: number } }>('/assignments', { params })
  return res.data
}

export async function createAssignment(input: CreateAssignmentInput): Promise<AssignmentRow> {
  const res = await apiClient.post<{ data: AssignmentRow }>('/assignments', input)
  return res.data.data
}

export async function updateAssignment(id: string, input: { status?: AssignmentStatus; due_date?: string | null }): Promise<AssignmentRow> {
  const res = await apiClient.patch<{ data: AssignmentRow }>(`/assignments/${id}`, input)
  return res.data.data
}

export async function deleteAssignment(id: string): Promise<void> {
  await apiClient.delete(`/assignments/${id}`)
}
