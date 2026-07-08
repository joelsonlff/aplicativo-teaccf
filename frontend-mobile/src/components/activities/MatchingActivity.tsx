import React, { useState, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import { speak } from '../../lib/speech'
import { InstructionBar, ProgressDots, type ActivityResult } from './common'
import { colors, spacing, fontSize, borderRadius, touchTarget } from '../../config/theme'

interface MatchPair { id: string; prompt: string; answer: string }
interface MatchEvent { pairId: string; correct: boolean; timeMs: number }

export function MatchingActivity({
  pairs,
  instruction,
  onComplete,
}: {
  pairs: MatchPair[]
  instruction?: string
  onComplete: (result: ActivityResult) => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [matched, setMatched]   = useState<Set<string>>(new Set())
  const [wrong, setWrong]       = useState<string | null>(null)
  const [events, setEvents]     = useState<MatchEvent[]>([])
  const startTimes              = useRef<Record<string, number>>({})

  // Embaralha respostas apenas uma vez
  const [shuffledAnswers] = useState(() => [...pairs].sort(() => Math.random() - 0.5))

  async function handlePromptPress(pair: MatchPair) {
    if (matched.has(pair.id)) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    speak(pair.prompt)
    setSelected(pair.id)
    startTimes.current[pair.id] = Date.now()
  }

  async function handleAnswerPress(pairId: string) {
    if (!selected) return
    const correct = pairId === selected
    const timeMs  = startTimes.current[selected]
      ? Date.now() - startTimes.current[selected]
      : 0

    const newEvents = [...events, { pairId: selected, correct, timeMs }]
    setEvents(newEvents)

    if (correct) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      speak('Muito bem!')
      const next = new Set(matched).add(selected)
      setMatched(next)
      setSelected(null)

      if (next.size === pairs.length) {
        setTimeout(() => onComplete({
          responseData: {
            // Acertos sobre o total de TENTATIVAS — erros contam
            correct: newEvents.filter((e) => e.correct).length,
            total:   newEvents.length,
            pairs_matched: newEvents,
          },
          attempts: newEvents.length,
        }), 600)
      }
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setWrong(selected)
      setTimeout(() => { setWrong(null); setSelected(null) }, 700)
    }
  }

  return (
    <View style={styles.container}>
      <InstructionBar text={instruction ?? 'Encontre os pares que combinam'} />
      <ProgressDots total={pairs.length} done={matched.size} />

      <View style={styles.columns}>
        {/* Coluna esquerda — prompts */}
        <View style={styles.col}>
          <Text style={styles.colHeader}>Encontre</Text>
          {pairs.map((p) => {
            const isSelected = selected === p.id
            const isDone     = matched.has(p.id)
            const isWrong    = wrong === p.id
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.chip,
                  isSelected && styles.chipSelected,
                  isDone     && styles.chipDone,
                  isWrong    && styles.chipWrong,
                ]}
                onPress={() => handlePromptPress(p)}
                disabled={isDone}
                accessibilityRole="button"
                accessibilityLabel={p.prompt}
                accessibilityState={{ selected: isSelected, disabled: isDone }}
              >
                <Text style={styles.chipText}>{p.prompt}</Text>
                {isDone && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Coluna direita — respostas (embaralhadas) */}
        <View style={styles.col}>
          <Text style={styles.colHeader}>Com</Text>
          {shuffledAnswers.map((p) => {
            const isDone = matched.has(p.id)
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.chip, isDone && styles.chipDone]}
                onPress={() => handleAnswerPress(p.id)}
                disabled={isDone || !selected}
                accessibilityRole="button"
                accessibilityLabel={p.answer}
                accessibilityState={{ disabled: isDone }}
              >
                <Text style={styles.chipText}>{p.answer}</Text>
                {isDone && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.lg },
  columns:   { flexDirection: 'row', gap: spacing.lg },
  col:       { flex: 1, gap: spacing.md },
  colHeader: { fontSize: fontSize.md, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },

  chip: {
    minHeight: touchTarget.comfortable,
    borderRadius: borderRadius.lg,
    borderWidth: 2.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chipSelected: { borderColor: colors.brand, backgroundColor: '#FFF0F2' },
  chipDone:     { borderColor: colors.success, backgroundColor: '#F0FFF0', opacity: 0.7 },
  chipWrong:    { borderColor: colors.attention, backgroundColor: '#FFF5EC' },
  chipText:     { fontSize: fontSize.lg, fontWeight: '600', color: colors.textPrimary, textAlign: 'center', flex: 1 },
  checkmark:    { fontSize: fontSize.md, color: colors.success, fontWeight: '700' },
})
