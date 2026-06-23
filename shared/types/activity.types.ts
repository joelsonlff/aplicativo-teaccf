export type ActivityType =
  | 'MATCHING'
  | 'SEQUENCE'
  | 'EMOTION_RECOGNITION'
  | 'COMMUNICATION'
  | 'ROUTINE'
  | 'SOCIAL_STORY'

export type TeaDomain = 'COGNITIVE' | 'COMMUNICATION' | 'EMOTIONAL' | 'SOCIAL' | 'ROUTINE'

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5

// Conteúdo por tipo de atividade

export interface MatchingPair {
  id: string
  stimulus: { type: 'image' | 'text' | 'audio'; url?: string; label: string }
  response: { type: 'image' | 'text' | 'audio'; url?: string; label: string }
}

export interface MatchingContent {
  pairs: MatchingPair[]
  timeLimitSeconds?: number
  allowRetries: boolean
  maxRetries: number
  shuffleOnRetry: boolean
}

export interface SequenceStep {
  id: string
  order: number
  imageUrl?: string
  audioUrl?: string
  label: string
  description?: string
}

export interface SequenceContent {
  steps: SequenceStep[]
  timeLimitSeconds?: number
  allowRetries: boolean
}

export interface EmotionOption {
  id: string
  emotion: string
  imageUrl: string
  audioLabel?: string
}

export interface EmotionContent {
  scenario: { imageUrl?: string; description: string }
  options: EmotionOption[]
  correctEmotionId: string
}

export type ActivityContent = MatchingContent | SequenceContent | EmotionContent | Record<string, unknown>

export interface Activity {
  id: string
  title: string
  description?: string
  type: ActivityType
  domain: TeaDomain
  difficulty: DifficultyLevel
  durationSeconds: number
  instructions: string
  content: ActivityContent
  mediaUrls: Record<string, string>
  tags: string[]
  isTemplate: boolean
  isActive: boolean
  createdBy: string
  schoolId?: string
  createdAt: string
  updatedAt: string
}
