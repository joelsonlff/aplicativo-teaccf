import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import { speak } from '../../lib/speech'
import { InstructionBar, ProgressDots, ContentImage, common, type ActivityResult } from './common'
import { colors, spacing, fontSize } from '../../config/theme'

interface SequenceStep { id: string; text: string; imageUrl?: string; emoji?: string; order: number }
interface SequenceEvent { stepId: string; correct: boolean }

// A criança monta a sequência tocando nas etapas na ordem certa.
// As etapas já colocadas aparecem em cima como "linha do tempo" concluída.
export function SequenceActivity({
  steps,
  instruction,
  onComplete,
}: {
  steps: SequenceStep[]
  instruction?: string
  onComplete: (result: ActivityResult) => void
}) {
  const ordered = [...steps].sort((a, b) => a.order - b.order)
  const [placedCount, setPlacedCount] = useState(0)
  const [wrongId, setWrongId]         = useState<string | null>(null)
  const [events, setEvents]           = useState<SequenceEvent[]>([])

  // Embaralha uma única vez as etapas ainda não colocadas
  const [shuffled] = useState(() => [...steps].sort(() => Math.random() - 0.5))
  const placedIds  = new Set(ordered.slice(0, placedCount).map((s) => s.id))
  const remaining  = shuffled.filter((s) => !placedIds.has(s.id))

  async function handleStepPress(step: SequenceStep) {
    const expected = ordered[placedCount]
    const correct  = step.id === expected.id
    const newEvents = [...events, { stepId: step.id, correct }]
    setEvents(newEvents)

    if (correct) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      speak(step.text)
      const nextCount = placedCount + 1
      setPlacedCount(nextCount)

      if (nextCount === ordered.length) {
        speak('Muito bem! Você completou a sequência!')
        setTimeout(() => onComplete({
          responseData: {
            correct: newEvents.filter((e) => e.correct).length,
            total:   newEvents.length,
            sequence_events: newEvents,
          },
          attempts: newEvents.length,
        }), 800)
      }
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setWrongId(step.id)
      setTimeout(() => setWrongId(null), 700)
    }
  }

  const position = placedCount + 1

  return (
    <View style={styles.container}>
      <InstructionBar text={instruction ?? 'Toque nas etapas na ordem certa'} />

      {/* Linha do tempo — etapas já colocadas */}
      <View style={styles.timeline}>
        {ordered.slice(0, placedCount).map((s, i) => (
          <View key={s.id} style={styles.timelineItem}>
            <Text style={styles.timelineNumber}>{i + 1}</Text>
            <Text style={styles.timelineText} numberOfLines={1}>{s.text}</Text>
            <Text style={styles.timelineCheck}>✓</Text>
          </View>
        ))}
      </View>

      {placedCount < ordered.length && (
        <Text style={styles.question}>
          {placedCount === 0 ? 'O que vem primeiro?' : 'E agora, o que vem depois?'}
        </Text>
      )}

      {/* Opções restantes — cartões grandes */}
      <View style={styles.options}>
        {remaining.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[common.optionCard, wrongId === s.id && common.optionCardWrong]}
            onPress={() => handleStepPress(s)}
            accessibilityRole="button"
            accessibilityLabel={`Etapa: ${s.text}. Posição atual: ${position} de ${ordered.length}`}
          >
            {(s.imageUrl || s.emoji) && <ContentImage uri={s.imageUrl} fallbackEmoji={s.emoji ?? '📋'} size={72} />}
            <Text style={common.optionLabel}>{s.text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ProgressDots total={ordered.length} done={placedCount} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.lg },

  timeline: { gap: spacing.sm },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F0FFF0',
    borderColor: colors.success,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  timelineNumber: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.success,
    minWidth: 28,
  },
  timelineText:  { flex: 1, fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary },
  timelineCheck: { fontSize: fontSize.lg, color: colors.success, fontWeight: '700' },

  question: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },

  options: { gap: spacing.md },
})
