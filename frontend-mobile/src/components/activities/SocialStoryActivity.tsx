import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import { speak, stopSpeaking } from '../../lib/speech'
import { InstructionBar, ProgressDots, ContentImage, common, type ActivityResult } from './common'
import { colors, spacing, fontSize, touchTarget, borderRadius } from '../../config/theme'

interface StorySlide { id: string; text: string; imageUrl?: string; emoji?: string }

// História social: um quadro por vez, narrado em voz alta.
// A criança controla o ritmo — pode voltar e reouvir quantas vezes quiser.
export function SocialStoryActivity({
  slides,
  instruction,
  onComplete,
}: {
  slides: StorySlide[]
  instruction?: string
  onComplete: (result: ActivityResult) => void
}) {
  const [index, setIndex] = useState(0)
  const viewedRef = useRef<Set<string>>(new Set())

  const slide  = slides[index]
  const isLast = index === slides.length - 1

  // Narra o quadro atual (depois da instrução, no primeiro)
  useEffect(() => {
    if (!slide) return undefined
    viewedRef.current.add(slide.id)
    const delay = index === 0 ? 2500 : 400
    const timer = setTimeout(() => speak(slide.text), delay)
    return () => clearTimeout(timer)
  }, [slide, index])

  if (!slide) return null

  async function handleNext() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    if (isLast) {
      stopSpeaking()
      speak('Fim da história! Muito bem!')
      setTimeout(() => onComplete({
        responseData: {
          steps_completed: viewedRef.current.size,
          total_steps:     slides.length,
          slides_viewed:   [...viewedRef.current],
        },
        attempts: 1,
      }), 800)
    } else {
      setIndex(index + 1)
    }
  }

  async function handleBack() {
    if (index === 0) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setIndex(index - 1)
  }

  return (
    <View style={styles.container}>
      {index === 0 && <InstructionBar text={instruction ?? 'Vamos ler uma história juntos'} />}

      {/* Quadro atual */}
      <View style={styles.slideArea}>
        <ContentImage uri={slide.imageUrl} fallbackEmoji={slide.emoji ?? '📖'} size={180} />
        <Text style={styles.slideText}>{slide.text}</Text>
        <TouchableOpacity
          style={styles.replayButton}
          onPress={() => speak(slide.text)}
          accessibilityRole="button"
          accessibilityLabel="Ouvir este quadro novamente"
        >
          <Text style={styles.replayIcon}>🔊</Text>
        </TouchableOpacity>
      </View>

      <ProgressDots total={slides.length} done={index} />

      {/* Navegação — no máximo 2 botões */}
      <View style={styles.nav}>
        {index > 0 ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Quadro anterior"
          >
            <Text style={styles.backBtnText}>◀ Voltar</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}

        <TouchableOpacity
          style={[common.bigButton, styles.nextBtn, isLast && common.bigButtonSuccess]}
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Terminar história' : 'Próximo quadro'}
        >
          <Text style={common.bigButtonText}>{isLast ? 'Terminar ⭐' : 'Próximo ▶'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.lg },

  slideArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  slideText: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
    paddingHorizontal: spacing.md,
  },
  replayButton: {
    minWidth: touchTarget.minimum,
    minHeight: touchTarget.minimum,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replayIcon: { fontSize: 28 },

  nav: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  backBtn: {
    minHeight: touchTarget.comfortable,
    minWidth: 110,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: fontSize.lg, fontWeight: '600', color: colors.textSecondary },
  nextBtn: { flex: 1, width: undefined },
})
