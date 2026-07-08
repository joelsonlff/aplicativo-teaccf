import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, ScrollView, Alert,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useSessionStore } from '../../../src/store/session.store'
import { fetchAssignmentDetail, type ActivityDetail } from '../../../src/services/assignments.api'
import { submitExecution } from '../../../src/services/executions.api'
import { colors, spacing, fontSize, borderRadius, touchTarget } from '../../../src/config/theme'

// ── MATCHING activity component ─────────────────────────────────────────────

interface MatchPair { id: string; prompt: string; answer: string }
interface MatchResult { pairId: string; correct: boolean; timeMs: number }

function MatchingActivity({
  pairs,
  instruction,
  onComplete,
}: {
  pairs: MatchPair[]
  instruction?: string
  onComplete: (results: MatchResult[]) => void
}) {
  const [selected, setSelected]     = useState<string | null>(null) // pair id
  const [matched, setMatched]       = useState<Set<string>>(new Set())
  const [wrong, setWrong]           = useState<string | null>(null)
  const [results, setResults]       = useState<MatchResult[]>([])
  const startTimes                  = useRef<Record<string, number>>({})

  // Embaralha respostas apenas uma vez
  const [shuffledAnswers] = useState(() =>
    [...pairs].sort(() => Math.random() - 0.5)
  )

  async function handlePromptPress(pairId: string) {
    if (matched.has(pairId)) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelected(pairId)
    startTimes.current[pairId] = Date.now()
  }

  async function handleAnswerPress(pairId: string) {
    if (!selected) return
    const correct = pairId === selected
    const timeMs  = startTimes.current[selected]
      ? Date.now() - startTimes.current[selected]
      : 0

    if (correct) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      const next = new Set(matched).add(selected)
      const newResults = [...results, { pairId: selected, correct: true, timeMs }]
      setMatched(next)
      setResults(newResults)
      setSelected(null)

      if (next.size === pairs.length) {
        // Tudo certo — pequeno delay antes de concluir
        setTimeout(() => onComplete(newResults), 600)
      }
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setWrong(selected)
      const newResults = [...results, { pairId: selected, correct: false, timeMs }]
      setResults(newResults)
      setTimeout(() => { setWrong(null); setSelected(null) }, 700)
    }
  }

  return (
    <View style={matchStyles.container}>
      {instruction && <Text style={matchStyles.instruction}>{instruction}</Text>}

      <View style={matchStyles.columns}>
        {/* Coluna esquerda — prompts */}
        <View style={matchStyles.col}>
          <Text style={matchStyles.colHeader}>Encontre</Text>
          {pairs.map((p) => {
            const isSelected = selected === p.id
            const isDone     = matched.has(p.id)
            const isWrong    = wrong === p.id
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  matchStyles.chip,
                  isSelected && matchStyles.chipSelected,
                  isDone     && matchStyles.chipDone,
                  isWrong    && matchStyles.chipWrong,
                ]}
                onPress={() => handlePromptPress(p.id)}
                disabled={isDone}
                accessibilityRole="button"
                accessibilityLabel={p.prompt}
                accessibilityState={{ selected: isSelected, disabled: isDone }}
              >
                <Text style={matchStyles.chipText}>{p.prompt}</Text>
                {isDone && <Text style={matchStyles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Coluna direita — respostas (embaralhadas) */}
        <View style={matchStyles.col}>
          <Text style={matchStyles.colHeader}>Com</Text>
          {shuffledAnswers.map((p) => {
            const isDone = matched.has(p.id)
            return (
              <TouchableOpacity
                key={p.id}
                style={[matchStyles.chip, isDone && matchStyles.chipDone]}
                onPress={() => handleAnswerPress(p.id)}
                disabled={isDone || !selected}
                accessibilityRole="button"
                accessibilityLabel={p.answer}
                accessibilityState={{ disabled: isDone }}
              >
                <Text style={matchStyles.chipText}>{p.answer}</Text>
                {isDone && <Text style={matchStyles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </View>
  )
}

// ── ActivityScreen ────────────────────────────────────────────────────────────

export default function ActivityScreen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>()
  const session          = useSessionStore((s) => s.session)
  const [activity, setActivity]   = useState<ActivityDetail | null>(null)
  const [loading, setLoading]     = useState(true)
  const [finished, setFinished]   = useState(false)
  const startedAt                 = useRef(new Date().toISOString())

  useEffect(() => {
    if (!assignmentId) return
    fetchAssignmentDetail(assignmentId)
      .then(setActivity)
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar a atividade.'))
      .finally(() => setLoading(false))
  }, [assignmentId])

  async function handleComplete(rawResults: MatchResult[]) {
    if (!activity || !session) return
    const correct = rawResults.filter((r) => r.correct).length

    await submitExecution({
      assignment_id:    activity.id,
      started_at:       startedAt.current,
      completed_at:     new Date().toISOString(),
      duration_seconds: Math.round((Date.now() - new Date(startedAt.current).getTime()) / 1000),
      attempts:         rawResults.length,
      response_data: {
        // Dados brutos: acertos sobre o total de TENTATIVAS (erros contam),
        // senão a precisão seria sempre 100% ao concluir todos os pares
        correct,
        total: rawResults.length,
        pairs_matched: rawResults,
      },
      was_assisted: false,
      device_info:  { platform: 'mobile', app_version: '1.0.0' },
    })

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setFinished(true)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </SafeAreaView>
    )
  }

  if (finished) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>Muito bem!</Text>
          <Text style={styles.doneSub}>Atividade concluída!</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              router.back()
            }}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (!activity) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Atividade não encontrada.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBack}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Text style={styles.headerBackText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{activity.activity_title}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {activity.activity_type === 'MATCHING' && activity.content.pairs ? (
          <MatchingActivity
            pairs={activity.content.pairs}
            instruction={activity.content.instruction}
            onComplete={handleComplete}
          />
        ) : (
          <View style={styles.center}>
            <Text style={styles.comingSoonEmoji}>🔧</Text>
            <Text style={styles.comingSoonText}>
              Este tipo de atividade ({activity.activity_type}) será disponibilizado em breve.
            </Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.brand,
    gap: spacing.sm,
  },
  headerBack:     { minWidth: touchTarget.minimum, minHeight: touchTarget.minimum, alignItems: 'center', justifyContent: 'center' },
  headerBackText: { fontSize: fontSize.xl, color: colors.brandText },
  headerTitle:    { flex: 1, fontSize: fontSize.lg, fontWeight: '700', color: colors.brandText, textAlign: 'center' },
  headerRight:    { minWidth: touchTarget.minimum },

  body: { padding: spacing.xl, flexGrow: 1 },

  doneEmoji: { fontSize: 80 },
  doneTitle: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.success },
  doneSub:   { fontSize: fontSize.lg, color: colors.textSecondary },

  backButton: {
    backgroundColor: colors.brand,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xxl,
    minHeight: touchTarget.comfortable,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  backButtonText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.brandText },

  errorText:      { fontSize: fontSize.lg, color: colors.textSecondary, textAlign: 'center' },
  comingSoonEmoji:{ fontSize: 56 },
  comingSoonText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
})

const matchStyles = StyleSheet.create({
  container:   { flex: 1, gap: spacing.lg },
  instruction: { fontSize: fontSize.lg, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
  columns:     { flexDirection: 'row', gap: spacing.lg },
  col:         { flex: 1, gap: spacing.md },
  colHeader:   { fontSize: fontSize.md, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },

  chip: {
    minHeight: touchTarget.comfortable,
    borderRadius: borderRadius.lg,
    borderWidth: 2.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chipSelected: { borderColor: colors.brand, backgroundColor: '#FFF0F2' },
  chipDone:     { borderColor: colors.success, backgroundColor: '#F0FFF0', opacity: 0.7 },
  chipWrong:    { borderColor: colors.attention, backgroundColor: '#FFF5EC' },
  chipText:     { fontSize: fontSize.lg, fontWeight: '600', color: colors.textPrimary, textAlign: 'center', flex: 1 },
  checkmark:    { fontSize: fontSize.md, color: colors.success, fontWeight: '700' },
})
