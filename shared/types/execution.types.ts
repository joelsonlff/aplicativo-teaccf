export type AssignmentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'SKIPPED'

export interface CustomParams {
  timeLimitOverride?: number
  difficultyOverride?: number
  pairsCount?: number
  reinforcementFrequency?: 'after_each_step' | 'after_activity'
  audioInstructions?: boolean
  hintDelaySeconds?: number
}

export interface ActivityAssignment {
  id: string
  activityId: string
  childId: string
  assignedBy: string
  status: AssignmentStatus
  dueDate?: string
  orderIndex: number
  customParams: CustomParams
  notes?: string
  assignedAt: string
  completedAt?: string
}

// Resposta por passo de execução
export interface ExecutionStep {
  stepIndex: number
  stimulusId: string
  responseId: string
  isCorrect: boolean
  reactionTimeMs: number
  timestamp: string
  hintsUsed?: number
}

export interface ExecutionPause {
  durationMs: number
  atStep: number
}

export interface ExecutionResponseData {
  steps: ExecutionStep[]
  hintsUsed: number
  pauses: ExecutionPause[]
}

export interface ActivityExecution {
  id: string
  assignmentId: string
  childId: string
  startedAt: string
  completedAt?: string
  durationSeconds?: number
  score?: number         // 0–100, calculado pelo backend
  accuracy?: number      // 0–100
  attempts: number
  responseData: ExecutionResponseData
  behavioralNotes?: string
  wasAssisted: boolean
  deviceInfo: Record<string, unknown>
  createdAt: string
}
