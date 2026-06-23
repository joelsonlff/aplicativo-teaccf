import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import { CAA_CATEGORIES, type CAACategory } from '../../data/caa-symbols'
import { colors, borderRadius } from '../../config/theme'

interface Props {
  activeCategoryId: string
  onSelectCategory: (id: string) => void
}

export function CategorySidebar({ activeCategoryId, onSelectCategory }: Props) {
  function handleSelect(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined)
    onSelectCategory(id)
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {CAA_CATEGORIES.map((cat) => (
        <CategoryButton
          key={cat.id}
          category={cat}
          isActive={cat.id === activeCategoryId}
          onPress={() => handleSelect(cat.id)}
        />
      ))}
    </ScrollView>
  )
}

function CategoryButton({
  category,
  isActive,
  onPress,
}: {
  category: CAACategory
  isActive: boolean
  onPress: () => void
}) {
  const isTeacher = category.isTeacherContent === true

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isActive && styles.buttonActive,
        isTeacher && styles.buttonTeacher,
        isActive && isTeacher && styles.buttonTeacherActive,
      ]}
      onPress={onPress}
      accessibilityLabel={category.label}
      accessibilityRole="button"
      activeOpacity={0.7}
    >
      <Text style={styles.emoji}>{category.emoji}</Text>
      <Text
        style={[
          styles.label,
          isActive && styles.labelActive,
          isTeacher && styles.labelTeacher,
        ]}
        numberOfLines={3}
        allowFontScaling={false}
      >
        {category.label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 90,
    backgroundColor: colors.surfaceAlt,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 80,
  },
  buttonActive: {
    backgroundColor: colors.primaryLight,
  },
  buttonTeacher: {
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  buttonTeacherActive: {
    backgroundColor: colors.primary,
  },
  emoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.textSecondary,
    lineHeight: 12,
  },
  labelActive: {
    color: colors.primaryDark,
  },
  labelTeacher: {
    color: colors.primary,
  },
})
