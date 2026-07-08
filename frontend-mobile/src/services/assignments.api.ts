import { apiClient } from './api.client'

export type AssignmentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'SKIPPED'
export type ActivityType = 'MATCHING' | 'SEQUENCE' | 'EMOTION_RECOGNITION' | 'COMMUNICATION' | 'ROUTINE' | 'SOCIAL_STORY'
export type TeaDomain = 'COGNITIVE' | 'COMMUNICATION' | 'EMOTIONAL' | 'SOCIAL' | 'ROUTINE'

export interface Assignment {
  id: string
  activity_id: string
  activity_title: string
  activity_type: ActivityType
  activity_domain: TeaDomain
  activity_difficulty: number
  activity_duration_seconds: number | null
  status: AssignmentStatus
  due_date: string | null
  custom_params: Record<string, unknown>
  notes: string | null
  assigned_at: string
}

export interface ActivityContent {
  // MATCHING
  pairs?: Array<{ id: string; prompt: string; answer: string; promptImageUrl?: string }>
  // SEQUENCE
  steps?: Array<{ id: string; text: string; imageUrl?: string; order: number }>
  // EMOTION_RECOGNITION
  emotions?: Array<{ id: string; label: string; imageUrl: string }>
  // COMMUNICATION
  options?: Array<{ id: string; label: string; imageUrl?: string }>
  correct_option_id?: string  // opcional: sem ele, toda escolha é válida (expressiva)
  // ROUTINE
  tasks?: Array<{ id: string; label: string; imageUrl?: string }>
  // SOCIAL_STORY
  slides?: Array<{ id: string; text: string; imageUrl?: string }>
  // instrução geral (todos os tipos)
  instruction?: string
}

export interface ActivityDetail extends Assignment {
  content: ActivityContent
}

export async function fetchTodayAssignments(childId: string): Promise<Assignment[]> {
  const res = await apiClient.get<{ data: Assignment[]; meta: { total: number } }>(
    '/assignments',
    { params: { child_id: childId, status: 'PENDING', limit: 10 } }
  )
  return res.data.data
}

export async function fetchAssignmentDetail(assignmentId: string): Promise<ActivityDetail> {
  const assignRes = await apiClient.get<{ data: Assignment }>(`/assignments/${assignmentId}`)
  const assignment = assignRes.data.data

  const activityRes = await apiClient.get<{ data: { content: ActivityContent } }>(`/activities/${assignment.activity_id}`)

  return { ...assignment, content: activityRes.data.data.content }
}
