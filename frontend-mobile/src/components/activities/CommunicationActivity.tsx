import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { TouchableOpacity, Text } from 'react-native'
import * as Haptics from 'expo-haptics'
import { speak } from '../../lib/speech'
import { InstructionBar, ContentImage, common, type ActivityResult } from './common'
import { spacing } from '../../config/theme'

interface CommunicationOption { id: string; label: string; imageUrl?: string; emoji?: string }
interface Selection { optionId: string; label: string; correct: boolean | null }

// PECS-like: a criança expressa uma intenção tocando no cartão.
// O app FALA a escolha — isso é o coração da comunicação alternativa.
// Se o professor definir `correctOptionId` no conteúdo, a rodada é avaliada;
// sem ele, toda escolha é válida (comunicação expressiva, sem certo/errado).
export function CommunicationActivity({
  options,
  instruction,
  correctOptionId,
  onComplete,
}: {
  options: CommunicationOption[]
  instruction?: string
  correctOptionId?: string
  onComplete: (result: ActivityResult) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [wrongId, setWrongId]       = useState<string | null>(null)
  const [selections, setSelections] = useState<Selection[]>([])

  const scored = Boolean(correctOptionId)

  async function handlePick(option: CommunicationOption) {
    if (selectedId) return // escolha já feita, aguardando conclusão

    const correct = scored ? option.id === correctOptionId : null
    const newSelections = [...selections, { optionId: option.id, label: option.label, correct }]
    setSelections(newSelections)

    if (scored && correct === false) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setWrongId(option.id)
      setTimeout(() => setWrongId(null), 700)
      return
    }

    // Escolha válida — o app dá voz à criança
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    speak(option.label)
    setSelectedId(option.id)

    setTimeout(() => onComplete({
      responseData: scored
        ? {
            correct: newSelections.filter((s) => s.correct === true).length,
            total:   newSelections.length,
            selections: newSelections,
          }
        // Sem gabarito: registra a escolha como dado bruto, sem score
        : { selections: newSelections },
      attempts: newSelections.length,
    }), 1200)
  }

  return (
    <View style={styles.container}>
      <InstructionBar text={instruction ?? 'O que você quer dizer? Toque no cartão'} />

      <View style={styles.options}>
        {options.map((o) => (
          <TouchableOpacity
            key={o.id}
            style={[
              common.optionCard,
              selectedId === o.id && common.optionCardCorrect,
              wrongId === o.id    && common.optionCardWrong,
            ]}
            onPress={() => handlePick(o)}
            accessibilityRole="button"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: selectedId === o.id }}
          >
            <ContentImage uri={o.imageUrl} fallbackEmoji={o.emoji ?? '💬'} size={88} />
            <Text style={common.optionLabel}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.lg },
  options:   { gap: spacing.md },
})
