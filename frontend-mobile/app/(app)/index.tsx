import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useSessionStore } from '../../src/store/session.store'
import { fetchTodayAssignments, type Assignment } from '../../src/services/assignments.api'
import { colors, spacing, fontSize, borderRadius, touchTarget } from '../../src/config/theme'

const DOMAIN_EMOJI: Record<string, string> = {
  COGNITIVE:     '🧠',
  COMMUNICATION: '💬',
  EMOTIONAL:     '❤️',
  SOCIAL:        '👫',
  ROUTINE:       '📋',
}

const DIFFICULTY_STARS = (d: number) => '⭐'.repeat(Math.min(d, 3))

export default function HomeScreen() {
  const session     = useSessionStore((s) => s.session)
  const clearSession = useSessionStore((s) => s.clearSession)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading]         = useState(true)
  const [completedToday, setCompleted] = useState(0)

  const loadAssignments = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const list = await fetchTodayAssignments(session.childId)
      setAssignments(list.slice(0, 3)) // máximo 3 elementos — regra TEA
    } catch {
      // sem conexão — mostra o que tiver
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { loadAssignments() }, [loadAssignments])

  async function handleActivityPress(assignment: Assignment) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push(`/(app)/activity/${assignment.id}`)
  }

  function handleLogout() {
    clearSession()
    router.replace('/pin-login')
  }

  const firstName = session?.childName?.split(' ')[0] ?? 'Olá'

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Cabeçalho com saudação */}
        <View style={styles.header}>
          <View style={styles.avatar} accessibilityLabel={`Avatar de ${firstName}`}>
            <Text style={styles.avatarEmoji}>😊</Text>
          </View>
          <Text style={styles.greeting}>Olá, {firstName}!</Text>
          <Text style={styles.subgreeting}>Veja suas atividades de hoje</Text>
        </View>

        {/* Progresso do dia — estrelas por atividade concluída */}
        {completedToday > 0 && (
          <View
            style={styles.progressRow}
            accessibilityLabel={`${completedToday} atividade${completedToday > 1 ? 's' : ''} concluída${completedToday > 1 ? 's' : ''} hoje`}
          >
            {Array.from({ length: completedToday }).map((_, i) => (
              <Text key={i} style={styles.star}>⭐</Text>
            ))}
          </View>
        )}

        {/* Lista de atividades (máx. 3) */}
        <View style={styles.activities}>
          {assignments.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyText}>Parabéns! Nenhuma atividade pendente por hoje.</Text>
            </View>
          ) : (
            assignments.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.card}
                onPress={() => handleActivityPress(a)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Atividade: ${a.activity_title}. Domínio: ${a.activity_domain}`}
              >
                <View style={styles.cardLeft}>
                  <Text style={styles.cardEmoji}>{DOMAIN_EMOJI[a.activity_domain] ?? '📚'}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{a.activity_title}</Text>
                  <Text style={styles.cardDiff}>{DIFFICULTY_STARS(a.activity_difficulty)}</Text>
                </View>
                <View style={styles.cardArrow}>
                  <Text style={styles.arrow}>▶</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Botão CAA */}
        <TouchableOpacity
          style={styles.caaButton}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            router.push('/(app)/caa')
          }}
          accessibilityRole="button"
          accessibilityLabel="Abrir comunicação alternativa"
        >
          <Text style={styles.caaButtonText}>💬  CAA</Text>
        </TouchableOpacity>

        {/* Sair (canto inferior — discreto) */}
        <TouchableOpacity style={styles.logout} onPress={handleLogout} accessibilityRole="button">
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.xl,
  },

  header: { alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji:   { fontSize: 52 },
  greeting:      { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textPrimary },
  subgreeting:   { fontSize: fontSize.md, color: colors.textSecondary },

  progressRow:   { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  star:          { fontSize: 28 },

  activities: { width: '100%', gap: spacing.md },

  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTarget.large,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLeft:  { width: 56, alignItems: 'center' },
  cardEmoji: { fontSize: 36 },
  cardBody:  { flex: 1, paddingHorizontal: spacing.sm, gap: 4 },
  cardTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.textPrimary },
  cardDiff:  { fontSize: fontSize.sm },
  cardArrow: { paddingLeft: spacing.sm },
  arrow:     { fontSize: fontSize.md, color: colors.textMuted },

  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  emptyEmoji: { fontSize: 64 },
  emptyText: {
    fontSize: fontSize.lg, color: colors.textSecondary,
    textAlign: 'center', lineHeight: 26,
  },

  caaButton: {
    width: '100%',
    minHeight: touchTarget.comfortable,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caaButtonText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primaryText },

  logout: { paddingVertical: spacing.sm },
  logoutText: { fontSize: fontSize.sm, color: colors.textMuted },
})
