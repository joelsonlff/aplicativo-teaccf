import { useEffect } from 'react'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useSessionStore } from '../src/store/session.store'

const CHILD_ID_KEY = 'ccf_child_id'

export default function RootIndex() {
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated)

  useEffect(() => {
    async function redirect() {
      if (isAuthenticated) {
        router.replace('/(app)')
        return
      }
      const childId = await SecureStore.getItemAsync(CHILD_ID_KEY)
      router.replace(childId ? '/pin-login' : '/setup')
    }
    redirect()
  }, [isAuthenticated])

  return null
}
