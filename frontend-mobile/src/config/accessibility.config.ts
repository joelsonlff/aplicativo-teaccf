// Configurações globais de acessibilidade para TEA

export const accessibilityConfig = {
  // Feedback sonoro
  audio: {
    enabled: true,
    successSound: 'success.mp3',
    errorSound: 'soft-error.mp3',   // Som suave — não assustador
    tapSound: 'tap.mp3',
    completionSound: 'celebration.mp3',
    volume: 0.7,
  },

  // Feedback tátil
  haptics: {
    enabled: true,
    onCorrect: 'success',           // Expo Haptics.NotificationFeedbackType.Success
    onIncorrect: 'warning',         // Expo Haptics.NotificationFeedbackType.Warning
    onTap: 'light',                 // Expo Haptics.ImpactFeedbackStyle.Light
  },

  // Animações
  animations: {
    enabled: true,
    reducedMotion: false,           // Respeitado pelo sistema operacional
    maxFrequencyHz: 2,              // Nunca mais rápido que 0.5s
    celebrationDuration: 2000,      // ms — comemoração controlada
  },

  // Interface
  ui: {
    minTouchTarget: 64,             // px — mínimo absoluto
    preferredTouchTarget: 80,       // px — confortável
    maxItemsPerScreen: 3,           // Máximo de elementos interativos
    fontScale: 1.0,                 // Pode ser ajustado por criança
    highContrast: false,            // Pode ser ativado por necessidade
  },

  // Temporizadores
  timers: {
    pauseBeforeHint: 10_000,        // ms antes de mostrar dica
    maxActivityTime: 300_000,       // ms — 5 minutos máximo por atividade
    breakSuggestionAfter: 600_000,  // ms — sugerir pausa após 10 minutos
  },
} as const

export type AccessibilityConfig = typeof accessibilityConfig
