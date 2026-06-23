import { create } from 'zustand'

interface ChildSession {
  childId: string
  childName: string
  avatarUrl?: string
  token: string
}

interface SessionState {
  session: ChildSession | null
  isAuthenticated: boolean
  setSession: (session: ChildSession) => void
  clearSession: () => void
}

// Zustand sem persist — token da criança NÃO é armazenado permanentemente
// A criança re-autentica via PIN a cada uso do app
export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  isAuthenticated: false,

  setSession: (session) => set({ session, isAuthenticated: true }),

  clearSession: () => set({ session: null, isAuthenticated: false }),
}))
