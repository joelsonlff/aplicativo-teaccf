import { create } from 'zustand'
import type { CAASymbol } from '../data/caa-symbols'

interface CAAState {
  // Símbolos selecionados para formar a frase atual
  selectedSymbols: CAASymbol[]
  // Categoria ativa no momento
  activeCategoryId: string
  // Símbolos extras carregados do servidor (uploads do professor)
  teacherSymbols: CAASymbol[]

  addSymbol: (symbol: CAASymbol) => void
  removeLastSymbol: () => void
  clearSymbols: () => void
  setCategory: (categoryId: string) => void
  setTeacherSymbols: (symbols: CAASymbol[]) => void
}

export const useCAAStore = create<CAAState>((set) => ({
  selectedSymbols: [],
  activeCategoryId: 'basic',
  teacherSymbols: [],

  addSymbol: (symbol) =>
    set((state) => ({
      selectedSymbols: [...state.selectedSymbols, symbol],
    })),

  removeLastSymbol: () =>
    set((state) => ({
      selectedSymbols: state.selectedSymbols.slice(0, -1),
    })),

  clearSymbols: () => set({ selectedSymbols: [] }),

  setCategory: (categoryId) => set({ activeCategoryId: categoryId }),

  setTeacherSymbols: (symbols) => set({ teacherSymbols: symbols }),
}))
