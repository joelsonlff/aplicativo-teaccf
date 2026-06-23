import React from 'react'
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native'
import { colors, spacing, fontSize, touchTarget } from '../config/theme'

// Tela inicial ultra-simplificada para a criança
// Máximo 3 elementos visíveis — nome, avatar, botão de atividade
// Implementação completa na Fase 4

export function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Saudação */}
        <View style={styles.greeting}>
          <View style={styles.avatar} accessibilityLabel="Avatar da criança">
            {/* Avatar da criança — Fase 4 */}
          </View>
          <Text style={styles.greetingText}>Olá!</Text>
        </View>

        {/* Atividade pendente principal */}
        <View style={styles.activitySection}>
          {/* Botão da atividade — Fase 4 */}
          <Text style={styles.placeholder}>Atividades carregando... (Fase 4)</Text>
        </View>

        {/* Indicador de progresso do dia (ícones, não números) */}
        <View style={styles.progressIndicator} accessibilityLabel="Progresso de hoje">
          {/* Estrelas ou ícones representando atividades concluídas — Fase 4 */}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
  },
  greetingText: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  activitySection: {
    width: '100%',
    minHeight: touchTarget.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  progressIndicator: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: touchTarget.minimum,
    alignItems: 'center',
  },
})
