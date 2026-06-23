import type { ActivityType, TeaDomain } from '../types/activity.types'

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  MATCHING: 'Associação de Pares',
  SEQUENCE: 'Sequência de Passos',
  EMOTION_RECOGNITION: 'Reconhecimento Emocional',
  COMMUNICATION: 'Comunicação',
  ROUTINE: 'Rotina',
  SOCIAL_STORY: 'História Social',
} as const

export const TEA_DOMAIN_LABELS: Record<TeaDomain, string> = {
  COGNITIVE: 'Desenvolvimento Cognitivo',
  COMMUNICATION: 'Comunicação',
  EMOTIONAL: 'Regulação Emocional',
  SOCIAL: 'Interação Social',
  ROUTINE: 'Rotina e Organização',
} as const

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Muito Fácil',
  2: 'Fácil',
  3: 'Médio',
  4: 'Difícil',
  5: 'Muito Difícil',
} as const

// Quais tipos de atividade são compatíveis com cada nível de comunicação
export const ACTIVITY_COMMUNICATION_COMPATIBILITY: Record<string, ActivityType[]> = {
  VERBAL: ['MATCHING', 'SEQUENCE', 'EMOTION_RECOGNITION', 'COMMUNICATION', 'ROUTINE', 'SOCIAL_STORY'],
  SEMI_VERBAL: ['MATCHING', 'SEQUENCE', 'EMOTION_RECOGNITION', 'ROUTINE'],
  NON_VERBAL: ['MATCHING', 'SEQUENCE', 'EMOTION_RECOGNITION'],
} as const
