import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import { speak } from '../../lib/speech'
import { InstructionBar, ProgressDots, ContentImage, common, type ActivityResult } from './common'
import { colors, spacing, fontSize } from '../../config/theme'

interface RoutineTask { id: string; label: string; imageUrl?: string }

// Rotina guiada: UMA tarefa por vez na tela, com um único botão "Feito!".
// Previsibilidade e foco — exatamente o que a criança TEA precisa.
export function RoutineActivity({
  tasks,
  instruction,
  onComplete,
}: {
  tasks: RoutineTask[]
  instruction?: string
  onComplete: (result: ActivityResult) => void
}) {
  const [current, setCurrent] = useState(0)
  const [checked, setChecked] = useState<Array<{ taskId: string; completedAt: string }>>([])

  const task = tasks[current]

  // Fala a tarefa atual quando ela aparece
  useEffect(() => {
    if (task) {
      const timer = setTimeout(() => speak(task.label), 900)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [task])

  if (!task) return null

  async function handleDone() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    const newChecked = [...checked, { taskId: task.id, completedAt: new Date().toISOString() }]
    setChecked(newChecked)

    if (current + 1 === tasks.length) {
      speak('Você completou toda a rotina! Parabéns!')
      setTimeout(() => onComplete({
        responseData: {
          steps_completed: newChecked.length,
          total_steps:     tasks.length,
          tasks_checked:   newChecked,
        },
        attempts: 1,
      }), 800)
    } else {
      setCurrent(current + 1)
    }
  }

  return (
    <View style={styles.container}>
      <InstructionBar text={instruction ?? 'Siga a sua rotina, um passo de cada vez'} />
      <ProgressDots total={tasks.length} done={current} />

      {/* Tarefa atual — grande e única */}
      <View style={styles.taskArea}>
        <ContentImage uri={task.imageUrl} fallbackEmoji="📋" size={160} />
        <Text style={styles.taskLabel}>{task.label}</Text>
      </View>

      <TouchableOpacity
        style={[common.bigButton, common.bigButtonSuccess]}
        onPress={handleDone}
        accessibilityRole="button"
        accessibilityLabel={`Marcar como feito: ${task.label}`}
      >
        <Text style={common.bigButtonText}>Feito! ✓</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.xl },
  taskArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  taskLabel: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 40,
  },
})
