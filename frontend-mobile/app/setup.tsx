import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { colors, spacing, fontSize, borderRadius, touchTarget } from '../src/config/theme'

const CHILD_ID_KEY = 'ccf_child_id'

export default function SetupScreen() {
  const [childId, setChildId] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const trimmed = childId.trim()
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(trimmed)) {
      Alert.alert('ID inválido', 'Por favor, cole o ID da criança gerado pelo sistema.')
      return
    }
    setSaving(true)
    await SecureStore.setItemAsync(CHILD_ID_KEY, trimmed)
    router.replace('/pin-login')
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <View style={styles.logoPlaceholder} />
          <Text style={styles.title}>Configuração do Dispositivo</Text>
          <Text style={styles.subtitle}>
            Cole o ID da criança gerado no painel do professor.{'\n'}
            Esta etapa é feita apenas uma vez.
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          placeholderTextColor={colors.textMuted}
          value={childId}
          onChangeText={setChildId}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          accessibilityLabel="ID da criança"
        />

        <TouchableOpacity
          style={[styles.button, !childId.trim() && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={!childId.trim() || saving}
          accessibilityRole="button"
          accessibilityLabel="Salvar configuração"
        >
          <Text style={styles.buttonText}>
            {saving ? 'Salvando...' : 'Confirmar'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  header: { alignItems: 'center', gap: spacing.md },
  logoPlaceholder: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.brand,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    minHeight: touchTarget.minimum,
  },
  button: {
    backgroundColor: colors.brand,
    borderRadius: borderRadius.lg,
    minHeight: touchTarget.comfortable,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: colors.textMuted },
  buttonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.brandText,
  },
})
