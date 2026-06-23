import React, { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import * as Haptics from 'expo-haptics'
import { apiClient } from '../src/services/api.client'
import { useSessionStore } from '../src/store/session.store'
import { colors, spacing, fontSize, borderRadius, touchTarget } from '../src/config/theme'

const CHILD_ID_KEY = 'ccf_child_id'
const PIN_LENGTH = 4

interface ChildLoginResponse {
  data: {
    child_token: string
    child: { id: string; full_name: string; avatar_url?: string }
  }
}

export default function PinLoginScreen() {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const setSession = useSessionStore((s) => s.setSession)

  const handleDigit = useCallback(async (digit: string) => {
    if (pin.length >= PIN_LENGTH) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const next = pin + digit
    setPin(next)

    if (next.length === PIN_LENGTH) {
      await submitPin(next)
    }
  }, [pin])

  const handleDelete = useCallback(async () => {
    if (!pin.length) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setPin((p) => p.slice(0, -1))
  }, [pin])

  async function submitPin(enteredPin: string) {
    setLoading(true)
    try {
      const childId = await SecureStore.getItemAsync(CHILD_ID_KEY)
      if (!childId) { router.replace('/setup'); return }

      const res = await apiClient.post<ChildLoginResponse>('/auth/child/login', {
        child_id: childId,
        pin: enteredPin,
      })

      const { child_token, child } = res.data.data
      setSession({ childId: child.id, childName: child.full_name, token: child_token })
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace('/(app)')
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('PIN incorreto', 'Tente novamente.', [{ text: 'OK', onPress: () => setPin('') }])
    } finally {
      setLoading(false)
    }
  }

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Logo / Branding */}
        <View style={styles.brandArea}>
          <View style={styles.logoCircle} />
          <Text style={styles.greeting}>Olá! 👋</Text>
          <Text style={styles.subtitle}>Digite seu PIN para entrar</Text>
        </View>

        {/* Indicadores de PIN */}
        <View style={styles.dots} accessibilityLabel={`${pin.length} de ${PIN_LENGTH} dígitos inseridos`}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i < pin.length && styles.dotFilled]}
            />
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.brand} style={styles.loader} />
        ) : (
          /* Teclado numérico TEA — botões grandes */
          <View style={styles.keypad}>
            {KEYS.map((key, i) => {
              if (key === '') return <View key={i} style={styles.keyEmpty} />
              const isDelete = key === '⌫'
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.key, isDelete && styles.keyDelete]}
                  onPress={() => isDelete ? handleDelete() : handleDigit(key)}
                  accessibilityRole="button"
                  accessibilityLabel={isDelete ? 'Apagar último dígito' : `Dígito ${key}`}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.keyText, isDelete && styles.keyDeleteText]}>
                    {key}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  brandArea: { alignItems: 'center', gap: spacing.md },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.brand,
  },
  greeting: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary },

  dots: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginVertical: spacing.md,
  },
  dot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.brand,
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: colors.brand },

  loader: { height: 200 },

  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    maxWidth: 320,
    justifyContent: 'center',
  },
  key: {
    width: 88,
    height: touchTarget.large,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    // sombra suave
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  keyDelete: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.attention,
  },
  keyEmpty: { width: 88, height: touchTarget.large },
  keyText: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  keyDeleteText: { color: colors.attention },
})
