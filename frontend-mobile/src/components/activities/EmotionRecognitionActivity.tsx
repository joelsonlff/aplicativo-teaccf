import React, { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import { speak } from '../../lib/speech'
import { InstructionBar, ProgressDots, ContentImage, common, type ActivityResult } from './common'
import { spacing } from '../../config/theme'

interface Emotion { id: string; label: string; imageUrl?: string; emoji?: string }
interface EmotionEvent { emotionId: string; chosenId: string; correct: boolean }

const MAX_OPTIONS = 3 // máximo de elementos interativos por tela — regra TEA

// Uma emoção por rodada: mostra a expressão e pergunta como a pessoa se sente.
export function EmotionRecognitionActivity({
  emotions,
  instruction,
  onComplete,
}: {
  emotions: Emotion[]
  instruction?: string
  onComplete: (result: ActivityResult) => void
}) {
  const [round, setRound]       = useState(0)
  const [wrongId, setWrongId]   = useState<string | null>(null)
  const [correctId, setCorrect] = useState<string | null>(null)
  const [events, setEvents]     = useState<EmotionEvent[]>([])

  // Ordem das rodadas embaralhada uma única vez
  const rounds = useMemo(() => [...emotions].sort(() => Math.random() - 0.5), [emotions])
  const target = rounds[round]

  // Opções da rodada: a correta + distratores, embaralhadas (recalcula por rodada)
  const options = useMemo(() => {
    if (!target) return []
    const distractors = emotions
      .filter((e) => e.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, MAX_OPTIONS - 1)
    return [target, ...distractors].sort(() => Math.random() - 0.5)
  }, [target, emotions])

  if (!target) return null

  async function handlePick(option: Emotion) {
    if (correctId) return // já acertou, aguardando próxima rodada
    const correct = option.id === target.id
    const newEvents = [...events, { emotionId: target.id, chosenId: option.id, correct }]
    setEvents(newEvents)

    if (correct) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      speak(`Isso! ${target.label}!`)
      setCorrect(option.id)

      setTimeout(() => {
        setCorrect(null)
        if (round + 1 === rounds.length) {
          onComplete({
            responseData: {
              correct: newEvents.filter((e) => e.correct).length,
              total:   newEvents.length,
              rounds:  newEvents,
            },
            attempts: newEvents.length,
          })
        } else {
          setRound(round + 1)
        }
      }, 900)
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setWrongId(option.id)
      setTimeout(() => setWrongId(null), 700)
    }
  }

  return (
    <View style={styles.container}>
      <InstructionBar text={instruction ?? 'Como essa pessoa está se sentindo?'} />

      {/* Expressão facial da rodada */}
      <View style={styles.faceArea}>
        <ContentImage uri={target.imageUrl} fallbackEmoji={target.emoji ?? '🙂'} size={180} />
      </View>

      {/* Opções de resposta — máx. 3 */}
      <View style={styles.options}>
        {options.map((o) => (
          <TouchableOpacity
            key={o.id}
            style={[
              common.optionCard,
              wrongId === o.id   && common.optionCardWrong,
              correctId === o.id && common.optionCardCorrect,
            ]}
            onPress={() => handlePick(o)}
            accessibilityRole="button"
            accessibilityLabel={o.label}
          >
            <Text style={common.optionLabel}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ProgressDots total={rounds.length} done={round} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.lg },
  faceArea:  { alignItems: 'center', paddingVertical: spacing.md },
  options:   { gap: spacing.md },
})
