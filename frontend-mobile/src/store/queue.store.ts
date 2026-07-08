import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import * as FileSystem from 'expo-file-system/legacy'

const QUEUE_FILE = `${FileSystem.documentDirectory}tea-execution-queue.json`

// Adaptador de storage usando expo-file-system — persiste a fila offline em arquivo JSON
const fileSystemStorage = {
  getItem: async (_key: string): Promise<string | null> => {
    try {
      const info = await FileSystem.getInfoAsync(QUEUE_FILE)
      if (!info.exists) return null
      return await FileSystem.readAsStringAsync(QUEUE_FILE)
    } catch {
      return null
    }
  },
  setItem: async (_key: string, value: string): Promise<void> => {
    try {
      await FileSystem.writeAsStringAsync(QUEUE_FILE, value)
    } catch {
      // falha silenciosa — sem armazenamento disponível
    }
  },
  removeItem: async (_key: string): Promise<void> => {
    try {
      const info = await FileSystem.getInfoAsync(QUEUE_FILE)
      if (info.exists) await FileSystem.deleteAsync(QUEUE_FILE)
    } catch {}
  },
}

export interface QueuedExecution {
  id: string
  assignmentId: string
  childId: string
  startedAt: string
  completedAt: string
  durationSeconds?: number
  attempts: number
  responseData: unknown
  behavioralNotes?: string
  wasAssisted: boolean
  deviceInfo: { platform: string; app_version: string }
  queuedAt: string
  retries: number
}

interface QueueState {
  pendingExecutions: QueuedExecution[]
  isSyncing: boolean

  enqueue:        (execution: Omit<QueuedExecution, 'queuedAt' | 'retries'>) => void
  dequeue:        (id: string) => void
  incrementRetry: (id: string) => void
  setSyncing:     (syncing: boolean) => void
  hasPending:     () => boolean
}

export const useQueueStore = create<QueueState>()(
  persist(
    (set, get) => ({
      pendingExecutions: [],
      isSyncing: false,

      enqueue: (execution) =>
        set((state) => ({
          pendingExecutions: [
            ...state.pendingExecutions,
            { ...execution, queuedAt: new Date().toISOString(), retries: 0 },
          ],
        })),

      dequeue: (id) =>
        set((state) => ({
          pendingExecutions: state.pendingExecutions.filter((e) => e.id !== id),
        })),

      incrementRetry: (id) =>
        set((state) => ({
          pendingExecutions: state.pendingExecutions.map((e) =>
            e.id === id ? { ...e, retries: e.retries + 1 } : e
          ),
        })),

      setSyncing: (isSyncing) => set({ isSyncing }),

      hasPending: () => get().pendingExecutions.length > 0,
    }),
    {
      name: 'tea-execution-queue',
      storage: createJSONStorage(() => fileSystemStorage),
    }
  )
)
