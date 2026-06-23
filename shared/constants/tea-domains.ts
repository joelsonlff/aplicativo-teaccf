// Domínios de desenvolvimento TEA — alinhados com DSM-5 e práticas ABA/PECS

export const AUTISM_LEVELS = {
  LEVEL_1: {
    label: 'Nível 1',
    description: 'Requer suporte',
    defaultDifficulty: 3,
  },
  LEVEL_2: {
    label: 'Nível 2',
    description: 'Requer suporte substancial',
    defaultDifficulty: 2,
  },
  LEVEL_3: {
    label: 'Nível 3',
    description: 'Requer suporte muito substancial',
    defaultDifficulty: 1,
  },
} as const

export const COMMON_THERAPIES = [
  'ABA',            // Applied Behavior Analysis
  'PECS',           // Picture Exchange Communication System
  'Fonoaudiologia',
  'Terapia Ocupacional',
  'Musicoterapia',
  'Equoterapia',
  'Hidroterapia',
  'Psicologia',
] as const

export const COMMON_BEHAVIORAL_TRIGGERS = [
  'Sons altos',
  'Transições bruscas',
  'Ambientes cheios',
  'Mudanças de rotina',
  'Texturas específicas',
  'Luzes intensas',
  'Cheiros fortes',
  'Espera prolongada',
] as const

export const REINFORCEMENT_STRATEGIES = {
  VISUAL: 'Reforço visual (estrelas, tokens, imagens)',
  AUDITORY: 'Reforço sonoro (sons, música, elogios)',
  COMBINED: 'Combinado (visual + sonoro)',
} as const
