// Paleta TEA-first: cores calmas, baixo estímulo, alto contraste apenas onde necessário

export const colors = {
  // Fundos — tons neutros e acolhedores
  background: '#FFF8F5',        // Creme quente (mais acolhedor que o anterior)
  surface: '#FFFFFF',
  surfaceAlt: '#F5EEE8',        // Creme mais profundo para áreas alternadas

  // Marca CCF — crimson + ouro
  brand: '#8B1C2C',
  brandDark: '#6A1420',
  brandGold: '#C8902E',
  brandGoldLight: '#E8B84E',
  brandText: '#FFFFFF',

  // Primária — azul-petróleo suave (mantido para elementos de conteúdo)
  primary: '#4A90A4',
  primaryLight: '#7AB8C8',
  primaryDark: '#2D6B7F',
  primaryText: '#FFFFFF',

  // Sucesso — verde suave (feedback positivo)
  success: '#5BA35B',
  successLight: '#A8D5A2',
  successText: '#FFFFFF',

  // Atenção — âmbar (nunca vermelho para erros na criança)
  attention: '#D4884A',
  attentionLight: '#F0C08A',

  // Texto
  textPrimary: '#2C2A28',
  textSecondary: '#6B6560',
  textMuted: '#A09890',
  textOnPrimary: '#FFFFFF',

  // Bordas
  border: '#DDD8D2',
  borderFocus: '#4A90A4',

  // Estados de atividade
  pending: '#E8A84E',
  inProgress: '#4A90A4',
  completed: '#5BA35B',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

export const fontSize = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  display: 40,
} as const

// Tamanhos mínimos de toque — TEA requer alvos grandes
export const touchTarget = {
  minimum: 64,    // Mínimo absoluto (44px é padrão iOS, TEA requer mais)
  comfortable: 80,
  large: 100,
} as const

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const

export const animation = {
  // Durações controladas — nada muito rápido para evitar sobrecarga sensorial
  fast: 200,
  normal: 350,
  slow: 500,
  // Sem animações acima de 2Hz (500ms período mínimo entre flashes)
} as const
