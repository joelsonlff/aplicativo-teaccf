import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Text,
  useWindowDimensions,
} from 'react-native'
// Para fala real: npx expo install expo-speech
// import * as Speech from 'expo-speech'
import { useCAAStore } from '../store/caa.store'
import { useSessionStore } from '../store/session.store'
import { CAA_SYMBOLS, type CAASymbol } from '../data/caa-symbols'
import { fetchTeacherSymbols } from '../services/aac.api'
import { SentenceBar } from '../components/caa/SentenceBar'
import { SymbolCard } from '../components/caa/SymbolCard'
import { CategorySidebar } from '../components/caa/CategorySidebar'
import { colors, spacing } from '../config/theme'

const SIDEBAR_WIDTH = 90
const NUM_COLS = 3

export function CAAScreen() {
  const { width } = useWindowDimensions()
  const {
    selectedSymbols,
    activeCategoryId,
    teacherSymbols,
    addSymbol,
    removeLastSymbol,
    clearSymbols,
    setCategory,
    setTeacherSymbols,
  } = useCAAStore()

  const session = useSessionStore((s) => s.session)
  const [loadingTeacher, setLoadingTeacher] = useState(false)

  // Carrega símbolos do professor quando a sessão estiver disponível
  useEffect(() => {
    const childId = session?.childId
    const token = session?.token
    if (!childId || !token) return

    setLoadingTeacher(true)
    fetchTeacherSymbols(childId, token)
      .then(setTeacherSymbols)
      .catch(() => { /* offline — usa apenas símbolos base */ })
      .finally(() => setLoadingTeacher(false))
  }, [session?.childId, session?.token, setTeacherSymbols])

  // Símbolos da categoria ativa (base + uploads do professor)
  const currentSymbols = useMemo<CAASymbol[]>(() => {
    const base = CAA_SYMBOLS.filter((s) => s.categoryId === activeCategoryId)
    const teacher = teacherSymbols.filter((s) => s.categoryId === activeCategoryId)
    return [...base, ...teacher]
  }, [activeCategoryId, teacherSymbols])

  const handleSpeak = useCallback(() => {
    if (selectedSymbols.length === 0) return
    const sentence = selectedSymbols.map((s) => s.label.replace('\n', ' ')).join(', ')

    // Substituir pelo código abaixo após: npx expo install expo-speech
    // Speech.speak(sentence, { language: 'pt-BR' })

    console.log('Falando:', sentence)
  }, [selectedSymbols])

  const renderSymbol = useCallback(
    ({ item }: { item: CAASymbol }) => <SymbolCard symbol={item} onPress={addSymbol} />,
    [addSymbol],
  )

  const keyExtractor = useCallback((item: CAASymbol) => item.id, [])

  return (
    <SafeAreaView style={styles.container}>
      <SentenceBar
        symbols={selectedSymbols}
        onSpeak={handleSpeak}
        onClear={clearSymbols}
        onRemoveLast={removeLastSymbol}
      />

      <View style={styles.body}>
        {currentSymbols.length === 0 ? (
          <EmptyCategory isTeacher={activeCategoryId === 'teacher'} width={width - SIDEBAR_WIDTH} />
        ) : (
          <FlatList
            data={currentSymbols}
            renderItem={renderSymbol}
            keyExtractor={keyExtractor}
            numColumns={NUM_COLS}
            key={`${activeCategoryId}-${NUM_COLS}`}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            initialNumToRender={16}
            maxToRenderPerBatch={16}
          />
        )}

        <CategorySidebar
          activeCategoryId={activeCategoryId}
          onSelectCategory={setCategory}
        />
      </View>
    </SafeAreaView>
  )
}

function EmptyCategory({ isTeacher, width }: { isTeacher: boolean; width: number }) {
  return (
    <View style={[styles.empty, { width }]}>
      <Text style={styles.emptyEmoji}>{isTeacher ? '🏫' : '📭'}</Text>
      <Text style={styles.emptyTitle}>
        {isTeacher ? 'Sem materiais da escola' : 'Nenhum símbolo nesta categoria'}
      </Text>
      {isTeacher && (
        <Text style={styles.emptySubtitle}>
          O professor pode adicionar imagens e tarefas pelo painel web.
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  row: {
    justifyContent: 'flex-start',
  },
  grid: {
    padding: spacing.xs,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 340,
  },
})
