import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { useSessionStore } from '../../src/store/session.store'
import { syncQueuedExecutions } from '../../src/services/executions.api'

export default function AppLayout() {
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/pin-login')
    }
  }, [isAuthenticated])

  // Tenta sincronizar fila offline ao entrar na sessão
  useEffect(() => {
    if (isAuthenticated) {
      syncQueuedExecutions().catch(() => {})
    }
  }, [isAuthenticated])

  if (!isAuthenticated) return null

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="activity/[assignmentId]" />
      <Stack.Screen name="caa" />
    </Stack>
  )
}
