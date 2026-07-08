import { apiClient } from './api.client'
import { useQueueStore } from '../store/queue.store'

export interface ExecutionPayload {
  assignment_id: string
  started_at: string
  completed_at?: string
  duration_seconds?: number
  attempts: number
  response_data: Record<string, unknown>
  behavioral_notes?: string
  was_assisted: boolean
  device_info: { platform: string; app_version: string }
}

export async function submitExecution(payload: ExecutionPayload): Promise<void> {
  try {
    await apiClient.post('/executions', payload)
  } catch {
    // Sem conexão — salva na fila offline para retry posterior
    useQueueStore.getState().enqueue({
      id: `${payload.assignment_id}-${Date.now()}`,
      assignmentId: payload.assignment_id,
      childId: '',            // o backend identifica a criança pelo token
      startedAt: payload.started_at,
      completedAt: payload.completed_at ?? new Date().toISOString(),
      durationSeconds: payload.duration_seconds,
      attempts: payload.attempts,
      responseData: payload.response_data,
      behavioralNotes: payload.behavioral_notes,
      wasAssisted: payload.was_assisted,
      deviceInfo: payload.device_info,
    })
  }
}

export async function syncQueuedExecutions(): Promise<void> {
  const store = useQueueStore.getState()
  if (store.isSyncing || !store.hasPending()) return

  store.setSyncing(true)
  try {
    for (const item of store.pendingExecutions) {
      try {
        await apiClient.post('/executions', {
          assignment_id:    item.assignmentId,
          started_at:       item.startedAt,
          completed_at:     item.completedAt,
          duration_seconds: item.durationSeconds,
          attempts:         item.attempts ?? 1,
          response_data:    item.responseData,
          behavioral_notes: item.behavioralNotes,
          was_assisted:     item.wasAssisted,
          device_info:      item.deviceInfo,
        })
        store.dequeue(item.id)
      } catch {
        if (item.retries >= 5) store.dequeue(item.id)
        else store.incrementRetry(item.id)
      }
    }
  } finally {
    store.setSyncing(false)
  }
}
