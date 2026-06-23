import { EventEmitter } from 'node:events'

// Tipos de eventos do sistema
export type AppEventMap = {
  'assignment.created': { assignmentId: string; childId: string; activityId: string; assignedBy: string }
  'assignment.completed': { assignmentId: string; childId: string; score: number }
  'execution.completed': { executionId: string; assignmentId: string; childId: string; score: number; accuracy: number }
  'child.created': { childId: string; createdBy: string }
  'progress.alert': { childId: string; domain: string; trend: number; type: 'regression' | 'ready_for_advance' }
}

export type AppEventName = keyof AppEventMap

class TypedEventBus extends EventEmitter {
  emit<K extends AppEventName>(event: K, payload: AppEventMap[K]): boolean {
    return super.emit(event, payload)
  }

  on<K extends AppEventName>(event: K, listener: (payload: AppEventMap[K]) => void): this {
    return super.on(event, listener)
  }

  off<K extends AppEventName>(event: K, listener: (payload: AppEventMap[K]) => void): this {
    return super.off(event, listener)
  }

  once<K extends AppEventName>(event: K, listener: (payload: AppEventMap[K]) => void): this {
    return super.once(event, listener)
  }
}

export const eventBus = new TypedEventBus()
eventBus.setMaxListeners(50)
