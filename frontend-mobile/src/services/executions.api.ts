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
      childId: '',            // preenchido pelo sync.service ao enviar
      startedAt: payload.started_at,
      completedAt: payload.completed_at ?? new Date().toISOString(),
      responseData: payload.response_data,
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
          response_data:    item.responseData,
          was_assisted:     item.wasAssisted,
          device_info:      item.deviceInfo,
          attempts:         1,
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
