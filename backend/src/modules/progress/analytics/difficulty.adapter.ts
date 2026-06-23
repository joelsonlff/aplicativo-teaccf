// Motor de adaptação de dificuldade
// Fase 1: lógica determinística simples
// Fase 5: substituir por chamada à Claude API

export interface ExecutionSummary {
  accuracy: number
  reactionTimeMs: number
  wasAssisted: boolean
  hintsUsed: number
  attempts: number
}

export interface DifficultyRecommendation {
  currentDifficulty: number
  recommendedDifficulty: number
  confidence: 'low' | 'medium' | 'high'
  reason: string
  shouldAlert: boolean
}

const ACCURACY_HIGH_THRESHOLD = 90
const ACCURACY_LOW_THRESHOLD = 50
const MIN_EXECUTIONS_FOR_RECOMMENDATION = 3

export function analyzeDifficultyTrend(
  currentDifficulty: number,
  recentExecutions: ExecutionSummary[]
): DifficultyRecommendation {
  if (recentExecutions.length < MIN_EXECUTIONS_FOR_RECOMMENDATION) {
    return {
      currentDifficulty,
      recommendedDifficulty: currentDifficulty,
      confidence: 'low',
      reason: `Execuções insuficientes para recomendação (mínimo ${MIN_EXECUTIONS_FOR_RECOMMENDATION})`,
      shouldAlert: false,
    }
  }

  const avgAccuracy =
    recentExecutions.reduce((sum, e) => sum + e.accuracy, 0) / recentExecutions.length

  const assistedCount = recentExecutions.filter((e) => e.wasAssisted).length
  const assistedRatio = assistedCount / recentExecutions.length

  // Pronto para avançar
  if (avgAccuracy >= ACCURACY_HIGH_THRESHOLD && assistedRatio < 0.2 && currentDifficulty < 5) {
    return {
      currentDifficulty,
      recommendedDifficulty: currentDifficulty + 1,
      confidence: 'high',
      reason: `Precisão média de ${avgAccuracy.toFixed(1)}% nas últimas ${recentExecutions.length} execuções. Pronto para o próximo nível.`,
      shouldAlert: false,
    }
  }

  // Dificuldade muito alta
  if ((avgAccuracy < ACCURACY_LOW_THRESHOLD || assistedRatio > 0.6) && currentDifficulty > 1) {
    return {
      currentDifficulty,
      recommendedDifficulty: currentDifficulty - 1,
      confidence: 'high',
      reason: `Precisão média de ${avgAccuracy.toFixed(1)}% com ${(assistedRatio * 100).toFixed(0)}% de assistência. Recomenda-se reduzir a dificuldade.`,
      shouldAlert: true,
    }
  }

  // Mantém dificuldade atual
  return {
    currentDifficulty,
    recommendedDifficulty: currentDifficulty,
    confidence: 'medium',
    reason: `Precisão de ${avgAccuracy.toFixed(1)}% está dentro do intervalo esperado.`,
    shouldAlert: false,
  }
}
