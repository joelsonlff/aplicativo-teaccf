import { apiClient } from './client'

export interface ActivityRecommendation {
  activity_id: string
  title:       string
  type:        string
  domain:      string
  difficulty:  number
  reason:      string
  priority:    'HIGH' | 'MEDIUM' | 'LOW'
}

export interface ProgressReport {
  summary:      string
  strengths:    string[]
  challenges:   string[]
  suggestions:  string[]
  next_steps:   string
  generated_at: string
}

export async function getRecommendations(childId: string): Promise<ActivityRecommendation[]> {
  const res = await apiClient.get<{ data: ActivityRecommendation[] }>(`/ai/recommendations/${childId}`)
  return res.data.data
}

export async function getProgressReport(childId: string): Promise<ProgressReport> {
  const res = await apiClient.get<{ data: ProgressReport }>(`/ai/progress-report/${childId}`)
  return res.data.data
}
