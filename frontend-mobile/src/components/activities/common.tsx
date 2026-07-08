import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { speak } from '../../lib/speech'
import { colors, spacing, fontSize, borderRadius, touchTarget } from '../../config/theme'

// Resultado bruto de qualquer atividade — o score é SEMPRE calculado no backend
export interface ActivityResult {
  responseData: Record<string, unknown>
  attempts: number
}

// ── Barra de instrução com leitura em voz alta ───────────────────────────────
// Fala automaticamente ao montar (crianças TEA muitas vezes são pré-leitoras)
// e permite reouvir tocando no alto-falante.

export function InstructionBar({ text }: { text: string }) {
  useEffect(() => {
    const timer = setTimeout(() => speak(text), 400)
    return () => clearTimeout(timer)
  }, [text])

  return (
    <View style={common.instructionBar}>
      <Text style={common.instructionText}>{text}</Text>
      <TouchableOpacity
        style={common.speakButton}
        onPress={() => speak(text)}
        accessibilityRole="button"
        accessibilityLabel="Ouvir a instrução novamente"
      >
        <Text style={common.speakIcon}>🔊</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Pontos de progresso (quantos passos faltam, sem números nem pressão) ─────

export function ProgressDots({ total, done }: { total: number; done: number }) {
  return (
    <View style={common.dotsRow} accessibilityLabel={`${done} de ${total} concluídos`}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[common.dot, i < done && common.dotDone]} />
      ))}
    </View>
  )
}

// ── Imagem do conteúdo com fallback de emoji ─────────────────────────────────

export function ContentImage({
  uri,
  fallbackEmoji,
  size = 160,
}: {
  uri?: string
  fallbackEmoji: string
  size?: number
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: borderRadius.lg }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    )
  }
  return <Text style={{ fontSize: size * 0.6 }}>{fallbackEmoji}</Text>
}

// ── Estilos compartilhados ────────────────────────────────────────────────────

export const common = StyleSheet.create({
  instructionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  instructionText: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 28,
  },
  speakButton: {
    minWidth: touchTarget.minimum,
    minHeight: touchTarget.minimum,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakIcon: { fontSize: 28 },

  dotsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  dot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.border,
  },
  dotDone: { backgroundColor: colors.success },

  // Cartão de opção grande — alvo de toque generoso
  optionCard: {
    minHeight: touchTarget.large,
    borderRadius: borderRadius.lg,
    borderWidth: 2.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  optionCardSelected: { borderColor: colors.primary, backgroundColor: '#EEF6F8' },
  optionCardCorrect:  { borderColor: colors.success, backgroundColor: '#F0FFF0' },
  optionCardWrong:    { borderColor: colors.attention, backgroundColor: '#FFF5EC' },
  optionLabel: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },

  // Botão de ação primário (ex.: "Feito!", "Próximo")
  bigButton: {
    minHeight: touchTarget.comfortable,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    width: '100%',
  },
  bigButtonSuccess: { backgroundColor: colors.success },
  bigButtonText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.primaryText,
  },
})
