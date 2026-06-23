import React from 'react'
import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import { SYMBOL_COLORS, type CAASymbol } from '../../data/caa-symbols'
import SYMBOL_IMAGES from '../../data/symbol-images'
import { borderRadius } from '../../config/theme'

interface Props {
  symbol: CAASymbol
  onPress: (symbol: CAASymbol) => void
}

export function SymbolCard({ symbol, onPress }: Props) {
  const palette = SYMBOL_COLORS[symbol.color]
  const localImage = SYMBOL_IMAGES[symbol.id]

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined)
    onPress(symbol)
  }

  return (
    <View style={styles.cell}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: palette.bg, borderColor: palette.border }]}
        onPress={handlePress}
        accessibilityLabel={symbol.label}
        accessibilityRole="button"
        activeOpacity={0.72}
      >
        {localImage != null ? (
          <Image source={localImage} style={styles.image} resizeMode="contain" />
        ) : symbol.imageUri ? (
          <Image source={{ uri: symbol.imageUri }} style={styles.image} resizeMode="contain" />
        ) : (
          <Text style={styles.emoji} allowFontScaling={false}>
            {symbol.emoji}
          </Text>
        )}
        <Text
          style={[styles.label, { color: palette.text }]}
          numberOfLines={2}
          adjustsFontSizeToFit
          allowFontScaling={false}
        >
          {symbol.label}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  // cell ocupa 1/numColumns da largura disponível e define a altura via aspectRatio
  cell: {
    flex: 1,
    padding: 5,
    aspectRatio: 1,
  },
  card: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingBottom: 8,
    paddingTop: 10,
    gap: 6,
  },
  emoji: {
    fontSize: 46,
    lineHeight: 52,
    textAlign: 'center',
  },
  image: {
    width: '70%',
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.4,
    lineHeight: 17,
  },
})
