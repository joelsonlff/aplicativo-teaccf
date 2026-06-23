import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { SYMBOL_COLORS, type CAASymbol } from '../../data/caa-symbols'
import { colors, spacing, fontSize, borderRadius } from '../../config/theme'

interface Props {
  symbols: CAASymbol[]
  onSpeak: () => void
  onClear: () => void
  onRemoveLast: () => void
}

export function SentenceBar({ symbols, onSpeak, onClear, onRemoveLast }: Props) {
  function handleSpeak() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined)
    onSpeak()
  }

  function handleClear() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined)
    onClear()
  }

  function handleRemoveLast() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined)
    onRemoveLast()
  }

  return (
    <View style={styles.container}>
      {/* Botão Falar */}
      <TouchableOpacity
        style={[styles.speakButton, symbols.length === 0 && styles.speakButtonDisabled]}
        onPress={handleSpeak}
        disabled={symbols.length === 0}
        accessibilityLabel="Falar a frase"
        accessibilityRole="button"
      >
        <Ionicons name="chatbubble" size={20} color={colors.primaryText} />
        <Text style={styles.speakText}>Falar</Text>
      </TouchableOpacity>

      {/* Área de símbolos selecionados */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {symbols.length === 0 ? (
          <Text style={styles.placeholder}>Toque nos símbolos para construir uma frase...</Text>
        ) : (
          symbols.map((sym, idx) => {
            const palette = SYMBOL_COLORS[sym.color]
            return (
              <View
                key={`${sym.id}-${idx}`}
                style={[styles.chip, { backgroundColor: palette.bg, borderColor: palette.border }]}
              >
                <Text style={styles.chipEmoji}>{sym.emoji}</Text>
                <Text style={[styles.chipLabel, { color: palette.text }]}>{sym.label}</Text>
              </View>
            )
          })
        )}
      </ScrollView>

      {/* Apagar última palavra */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleRemoveLast}
        disabled={symbols.length === 0}
        accessibilityLabel="Apagar última palavra"
        accessibilityRole="button"
      >
        <Ionicons
          name="backspace-outline"
          size={20}
          color={symbols.length === 0 ? colors.textMuted : colors.textSecondary}
        />
        <Text style={[styles.actionLabel, symbols.length === 0 && styles.actionLabelDisabled]}>
          Apagar{'\n'}Palavra
        </Text>
      </TouchableOpacity>

      {/* Limpar tudo */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleClear}
        disabled={symbols.length === 0}
        accessibilityLabel="Limpar tudo"
        accessibilityRole="button"
      >
        <Ionicons
          name="trash-outline"
          size={20}
          color={symbols.length === 0 ? colors.textMuted : colors.attention}
        />
        <Text style={[styles.actionLabel, symbols.length === 0 && styles.actionLabelDisabled]}>
          Limpar
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 76,
    gap: spacing.xs,
  },
  speakButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 76,
    minHeight: 60,
    gap: 2,
  },
  speakButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  speakText: {
    color: colors.primaryText,
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    minHeight: 60,
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    gap: 4,
  },
  chipEmoji: {
    fontSize: 18,
  },
  chipLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 70,
    minHeight: 60,
    gap: 2,
  },
  actionLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  actionLabelDisabled: {
    color: colors.textMuted,
  },
})
