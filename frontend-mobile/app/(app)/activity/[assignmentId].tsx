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
import { stopSpeaking } from '../../../src/lib/speech'
import { type ActivityResult } from '../../../src/components/activities/common'
import { MatchingActivity } from '../../../src/components/activities/MatchingActivity'
import { SequenceActivity } from '../../../src/components/activities/SequenceActivity'
import { EmotionRecognitionActivity } from '../../../src/components/activities/EmotionRecognitionActivity'
import { CommunicationActivity } from '../../../src/components/activities/CommunicationActivity'
import { RoutineActivity } from '../../../src/components/activities/RoutineActivity'
import { SocialStoryActivity } from '../../../src/components/activities/SocialStoryActivity'
import { colors, spacing, fontSize, borderRadius, touchTarget } from '../../../src/config/theme'

export default function ActivityScreen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>()
  const session          = useSessionStore((s) => s.session)
  const [activity, setActivity] = useState<ActivityDetail | null>(null)
  const [loading, setLoading]   = useState(true)
  const [finished, setFinished] = useState(false)
  const startedAt               = useRef(new Date().toISOString())

  useEffect(() => {
    if (!assignmentId) return
    fetchAssignmentDetail(assignmentId)
      .then(setActivity)
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar a atividade.'))
      .finally(() => setLoading(false))
  }, [assignmentId])

  // Silencia a narração ao sair da tela
  useEffect(() => () => stopSpeaking(), [])

  async function handleComplete(result: ActivityResult) {
    if (!activity || !session) return

    await submitExecution({
      assignment_id:    activity.id,
      started_at:       startedAt.current,
      completed_at:     new Date().toISOString(),
      duration_seconds: Math.max(1, Math.round((Date.now() - new Date(startedAt.current).getTime()) / 1000)),
      attempts:         Math.max(1, result.attempts),
      response_data:    result.responseData,
      was_assisted:     false,
      device_info:      { platform: 'mobile', app_version: '1.0.0' },
    })

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setFinished(true)
  }

  function renderActivity(a: ActivityDetail) {
    const { content } = a
    switch (a.activity_type) {
      case 'MATCHING':
        if (content.pairs?.length) {
          return <MatchingActivity pairs={content.pairs} instruction={content.instruction} onComplete={handleComplete} />
        }
        break
      case 'SEQUENCE':
        if (content.steps?.length) {
          return <SequenceActivity steps={content.steps} instruction={content.instruction} onComplete={handleComplete} />
        }
        break
      case 'EMOTION_RECOGNITION':
        if (content.emotions?.length) {
          return <EmotionRecognitionActivity emotions={content.emotions} instruction={content.instruction} onComplete={handleComplete} />
        }
        break
      case 'COMMUNICATION':
        if (content.options?.length) {
          return (
            <CommunicationActivity
              options={content.options}
              instruction={content.instruction}
              correctOptionId={content.correct_option_id}
              onComplete={handleComplete}
            />
          )
        }
        break
      case 'ROUTINE':
        if (content.tasks?.length) {
          return <RoutineActivity tasks={content.tasks} instruction={content.instruction} onComplete={handleComplete} />
        }
        break
      case 'SOCIAL_STORY':
        if (content.slides?.length) {
          return <SocialStoryActivity slides={content.slides} instruction={content.instruction} onComplete={handleComplete} />
        }
        break
    }

    // Conteúdo vazio ou malformado — mensagem gentil, sem tela de erro assustadora
    return (
      <View style={styles.center}>
        <Text style={styles.comingSoonEmoji}>🔧</Text>
        <Text style={styles.comingSoonText}>
          Esta atividade ainda está sendo preparada. Peça ajuda a um adulto.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    )
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
          onPress={() => { stopSpeaking(); router.back() }}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Text style={styles.headerBackText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{activity.activity_title}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {renderActivity(activity)}
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
