import { describe, it, expect } from 'vitest'
import { calculateScore } from '../src/modules/executions/executions.service'

describe('calculateScore', () => {
  it('calcula score e accuracy a partir de correct/total', () => {
    expect(calculateScore({ correct: 3, total: 4 })).toEqual({ score: 75, accuracy: 75 })
    expect(calculateScore({ correct: 4, total: 4 })).toEqual({ score: 100, accuracy: 100 })
    expect(calculateScore({ correct: 0, total: 4 })).toEqual({ score: 0, accuracy: 0 })
  })

  it('calcula a partir de steps_completed/total_steps (ROUTINE, SOCIAL_STORY)', () => {
    expect(calculateScore({ steps_completed: 2, total_steps: 5 })).toEqual({ score: 40, accuracy: 40 })
    expect(calculateScore({ steps_completed: 5, total_steps: 5 })).toEqual({ score: 100, accuracy: 100 })
  })

  it('retorna null quando não há dados pontuáveis (ex.: COMMUNICATION expressiva)', () => {
    expect(calculateScore({ selections: [{ optionId: 'x' }] })).toEqual({ score: null, accuracy: null })
    expect(calculateScore({})).toEqual({ score: null, accuracy: null })
  })

  it('não divide por zero', () => {
    expect(calculateScore({ correct: 0, total: 0 })).toEqual({ score: null, accuracy: null })
    expect(calculateScore({ steps_completed: 0, total_steps: 0 })).toEqual({ score: null, accuracy: null })
  })

  it('ignora valores não numéricos (dados brutos vindos do app)', () => {
    expect(calculateScore({ correct: '3', total: 4 })).toEqual({ score: null, accuracy: null })
  })
})
