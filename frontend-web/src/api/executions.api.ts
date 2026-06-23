import { apiClient } from './client'

export interface ExecutionRow {
  id: string
  assignment_id: string
  child_id: string
  started_at: string
  completed_at: string | null
  duration_seconds: number | null
  score: number | null
  accuracy: number | null
  attempts: number
  was_assisted: boolean
  created_at: string
}

export interface ProgressSummary {
  total_executions: number
  completed_executions: number
  average_score: number | null
  average_accuracy: number | null
  total_time_seconds: number
  domains: Record<string, { count: number; avg_score: number | null }>
  last_execution_at: string | null
}

export async function listExecutions(params: {
  child_id: string
  page?: number
  limit?: number
}): Promise<{ data: ExecutionRow[]; meta: { total: number } }> {
  const res = await apiClient.get<{ data: ExecutionRow[]; meta: { total: number } }>('/executions', { params })
  return res.data
}

export async function getProgressSummary(childId: string): Promise<ProgressSummary> {
  const res = await apiClient.get<{ data: ProgressSummary }>(`/executions/summary/${childId}`)
  return res.data.data
}
