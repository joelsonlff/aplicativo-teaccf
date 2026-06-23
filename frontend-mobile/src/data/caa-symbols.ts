export type SymbolColor = 'pronoun' | 'verb' | 'noun' | 'negative' | 'yes' | 'no' | 'teacher'

export interface CAASymbol {
  id: string
  label: string
  emoji: string        // exibido enquanto imageUri não estiver disponível
  color: SymbolColor
  categoryId: string
  imageUri?: string    // URI de imagem (upload do professor ou ARASAAC futuro)
}

export interface CAACategory {
  id: string
  label: string
  emoji: string
  isTeacherContent?: boolean
}

export const SYMBOL_COLORS: Record<SymbolColor, { bg: string; text: string; border: string }> = {
  pronoun:  { bg: '#F5D95C', text: '#2C2A28', border: '#C8AE1A' },
  verb:     { bg: '#B8E6C4', text: '#1A4A2A', border: '#7DC894' },
  noun:     { bg: '#FFFFFF', text: '#2C2A28', border: '#DDD8D2' },
  negative: { bg: '#E05252', text: '#FFFFFF', border: '#C03030' },
  yes:      { bg: '#5BA35B', text: '#FFFFFF', border: '#3D7A3D' },
  no:       { bg: '#E05252', text: '#FFFFFF', border: '#C03030' },
  teacher:  { bg: '#4A90A4', text: '#FFFFFF', border: '#2D6B7F' },
}

export const CAA_CATEGORIES: CAACategory[] = [
  { id: 'basic',    label: 'Palavras\nBásicas', emoji: '💬' },
  { id: 'emotions', label: 'Emoções',           emoji: '😊' },
  { id: 'food',     label: 'Comida',            emoji: '🍎' },
  { id: 'toys',     label: 'Brinquedos',        emoji: '🧸' },
  { id: 'bathroom', label: 'Banheiro',          emoji: '🚽' },
  { id: 'places',   label: 'Lugares',           emoji: '📍' },
  { id: 'routine',  label: 'Rotina',            emoji: '📅' },
  { id: 'teacher',  label: 'Escola',            emoji: '🏫', isTeacherContent: true },
]

export const CAA_SYMBOLS: CAASymbol[] = [
  // ── BÁSICAS: Pronomes (amarelo) ──────────────────────────────────
  { id: 'eu',       label: 'EU',      emoji: '🙋',  color: 'pronoun',  categoryId: 'basic' },
  { id: 'voce',     label: 'VOCÊ',    emoji: '👉',  color: 'pronoun',  categoryId: 'basic' },
  { id: 'nos',      label: 'NÓS',     emoji: '👥',  color: 'pronoun',  categoryId: 'basic' },
  { id: 'pai',      label: 'PAI',     emoji: '👨',  color: 'pronoun',  categoryId: 'basic' },
  { id: 'mae',      label: 'MÃE',     emoji: '👩',  color: 'pronoun',  categoryId: 'basic' },
  { id: 'pessoas',  label: 'PESSOAS', emoji: '👪',  color: 'pronoun',  categoryId: 'basic' },

  // ── BÁSICAS: Sim / Não ───────────────────────────────────────────
  { id: 'sim',      label: 'SIM',     emoji: '✅',  color: 'yes',      categoryId: 'basic' },
  { id: 'nao',      label: 'NÃO',     emoji: '❌',  color: 'no',       categoryId: 'basic' },

  // ── BÁSICAS: Verbos (verde) ──────────────────────────────────────
  { id: 'quero',    label: 'QUERO',   emoji: '🙏',  color: 'verb',     categoryId: 'basic' },
  { id: 'pegar',    label: 'PEGAR',   emoji: '✋',  color: 'verb',     categoryId: 'basic' },
  { id: 'pode',     label: 'PODE',    emoji: '👍',  color: 'verb',     categoryId: 'basic' },
  { id: 'acabou',   label: 'ACABOU',  emoji: '🛑',  color: 'verb',     categoryId: 'basic' },
  { id: 'olha',     label: 'OLHA',    emoji: '👀',  color: 'verb',     categoryId: 'basic' },
  { id: 'esperar',  label: 'ESPERAR', emoji: '⏳',  color: 'verb',     categoryId: 'basic' },
  { id: 'ir',       label: 'IR',      emoji: '➡️', color: 'verb',     categoryId: 'basic' },
  { id: 'comer',    label: 'COMER',   emoji: '🍽️', color: 'verb',     categoryId: 'basic' },
  { id: 'ajuda',    label: 'AJUDA',   emoji: '🤝',  color: 'verb',     categoryId: 'basic' },
  { id: 'sair',     label: 'SAIR',    emoji: '🚪',  color: 'verb',     categoryId: 'basic' },
  { id: 'beber',    label: 'BEBER',   emoji: '💧',  color: 'verb',     categoryId: 'basic' },
  { id: 'abrir',    label: 'ABRIR',   emoji: '📂',  color: 'verb',     categoryId: 'basic' },
  { id: 'fechar',   label: 'FECHAR',  emoji: '📁',  color: 'verb',     categoryId: 'basic' },
  { id: 'brincar',  label: 'BRINCAR', emoji: '🎮',  color: 'verb',     categoryId: 'basic' },

  // ── BÁSICAS: Neutrais ────────────────────────────────────────────
  { id: 'mais',         label: 'MAIS',          emoji: '➕',  color: 'noun',     categoryId: 'basic' },
  { id: 'ah-nao',       label: 'AH, NÃO',       emoji: '😤',  color: 'noun',     categoryId: 'basic' },
  { id: 'outra-coisa',  label: 'OUTRA\nCOISA',  emoji: '🔄',  color: 'noun',     categoryId: 'basic' },

  // ── BÁSICAS: Negativas (vermelho) ────────────────────────────────
  { id: 'nao-quero',    label: 'NÃO\nQUERO',    emoji: '🚫',  color: 'negative', categoryId: 'basic' },
  { id: 'nao-pode',     label: 'NÃO,\nNÃO PODE',emoji: '⛔',  color: 'negative', categoryId: 'basic' },

  // ── EMOÇÕES ──────────────────────────────────────────────────────
  { id: 'feliz',      label: 'FELIZ',      emoji: '😄',  color: 'noun', categoryId: 'emotions' },
  { id: 'triste',     label: 'TRISTE',     emoji: '😢',  color: 'noun', categoryId: 'emotions' },
  { id: 'bravo',      label: 'BRAVO',      emoji: '😠',  color: 'noun', categoryId: 'emotions' },
  { id: 'assustado',  label: 'ASSUSTADO',  emoji: '😨',  color: 'noun', categoryId: 'emotions' },
  { id: 'calmo',      label: 'CALMO',      emoji: '😌',  color: 'noun', categoryId: 'emotions' },
  { id: 'cansado',    label: 'CANSADO',    emoji: '😴',  color: 'noun', categoryId: 'emotions' },
  { id: 'com-dor',    label: 'COM DOR',    emoji: '😣',  color: 'noun', categoryId: 'emotions' },
  { id: 'surpreso',   label: 'SURPRESO',   emoji: '😲',  color: 'noun', categoryId: 'emotions' },
  { id: 'animado',    label: 'ANIMADO',    emoji: '🤩',  color: 'noun', categoryId: 'emotions' },
  { id: 'nervoso',    label: 'NERVOSO',    emoji: '😰',  color: 'noun', categoryId: 'emotions' },
  { id: 'com-medo',   label: 'COM MEDO',   emoji: '😱',  color: 'noun', categoryId: 'emotions' },
  { id: 'orgulhoso',  label: 'ORGULHOSO',  emoji: '🥲',  color: 'noun', categoryId: 'emotions' },

  // ── COMIDA ───────────────────────────────────────────────────────
  { id: 'agua',       label: 'ÁGUA',      emoji: '💧',  color: 'noun', categoryId: 'food' },
  { id: 'lanche',     label: 'LANCHE',    emoji: '🥪',  color: 'noun', categoryId: 'food' },
  { id: 'fruta',      label: 'FRUTA',     emoji: '🍎',  color: 'noun', categoryId: 'food' },
  { id: 'biscoito',   label: 'BISCOITO',  emoji: '🍪',  color: 'noun', categoryId: 'food' },
  { id: 'suco',       label: 'SUCO',      emoji: '🧃',  color: 'noun', categoryId: 'food' },
  { id: 'arroz',      label: 'ARROZ',     emoji: '🍚',  color: 'noun', categoryId: 'food' },
  { id: 'feijao',     label: 'FEIJÃO',    emoji: '🫘',  color: 'noun', categoryId: 'food' },
  { id: 'pao',        label: 'PÃO',       emoji: '🍞',  color: 'noun', categoryId: 'food' },
  { id: 'leite',      label: 'LEITE',     emoji: '🥛',  color: 'noun', categoryId: 'food' },
  { id: 'sorvete',    label: 'SORVETE',   emoji: '🍦',  color: 'noun', categoryId: 'food' },
  { id: 'iogurte',    label: 'IOGURTE',   emoji: '🥣',  color: 'noun', categoryId: 'food' },
  { id: 'bolo',       label: 'BOLO',      emoji: '🎂',  color: 'noun', categoryId: 'food' },

  // ── BRINQUEDOS ───────────────────────────────────────────────────
  { id: 'bola',       label: 'BOLA',          emoji: '⚽',  color: 'noun', categoryId: 'toys' },
  { id: 'boneca',     label: 'BONECA',         emoji: '🪆',  color: 'noun', categoryId: 'toys' },
  { id: 'quebra-cab', label: 'QUEBRA-\nCABEÇA',emoji: '🧩',  color: 'noun', categoryId: 'toys' },
  { id: 'massinha',   label: 'MASSINHA',       emoji: '🎨',  color: 'noun', categoryId: 'toys' },
  { id: 'tablet',     label: 'TABLET',         emoji: '📱',  color: 'noun', categoryId: 'toys' },
  { id: 'livro',      label: 'LIVRO',          emoji: '📚',  color: 'noun', categoryId: 'toys' },
  { id: 'carrinho',   label: 'CARRINHO',       emoji: '🚗',  color: 'noun', categoryId: 'toys' },
  { id: 'pintar',     label: 'PINTAR',         emoji: '🖍️', color: 'noun', categoryId: 'toys' },

  // ── BANHEIRO ─────────────────────────────────────────────────────
  { id: 'xixi',       label: 'XIXI',        emoji: '🚽',  color: 'noun', categoryId: 'bathroom' },
  { id: 'coco',       label: 'COCÔ',        emoji: '🚽',  color: 'noun', categoryId: 'bathroom' },
  { id: 'lavar-maos', label: 'LAVAR\nMÃOS', emoji: '🧼',  color: 'noun', categoryId: 'bathroom' },
  { id: 'papel-hig',  label: 'PAPEL\nHIG.', emoji: '🧻',  color: 'noun', categoryId: 'bathroom' },

  // ── LUGARES ──────────────────────────────────────────────────────
  { id: 'sala-aula',  label: 'SALA DE\nAULA',  emoji: '🏫',  color: 'noun', categoryId: 'places' },
  { id: 'parque',     label: 'PARQUE',          emoji: '🌳',  color: 'noun', categoryId: 'places' },
  { id: 'refeitorio', label: 'REFEITÓRIO',      emoji: '🍽️', color: 'noun', categoryId: 'places' },
  { id: 'biblioteca', label: 'BIBLIOTECA',      emoji: '📚',  color: 'noun', categoryId: 'places' },
  { id: 'casa',       label: 'CASA',            emoji: '🏠',  color: 'noun', categoryId: 'places' },
  { id: 'carro',      label: 'CARRO',           emoji: '🚗',  color: 'noun', categoryId: 'places' },
  { id: 'banheiro-pl',label: 'BANHEIRO',        emoji: '🚽',  color: 'noun', categoryId: 'places' },
  { id: 'quadra',     label: 'QUADRA',          emoji: '🏃',  color: 'noun', categoryId: 'places' },

  // ── ROTINA ───────────────────────────────────────────────────────
  { id: 'acordar',    label: 'ACORDAR',       emoji: '⏰',  color: 'noun', categoryId: 'routine' },
  { id: 'banho',      label: 'BANHO',         emoji: '🚿',  color: 'noun', categoryId: 'routine' },
  { id: 'escovar',    label: 'ESCOVAR\nDENTES',emoji: '🪥', color: 'noun', categoryId: 'routine' },
  { id: 'cafe',       label: 'CAFÉ DA\nMANHÃ', emoji: '☕', color: 'noun', categoryId: 'routine' },
  { id: 'escola-rot', label: 'IR PARA\nESCOLA',emoji: '🎒', color: 'noun', categoryId: 'routine' },
  { id: 'almoco',     label: 'ALMOÇO',         emoji: '🍛',  color: 'noun', categoryId: 'routine' },
  { id: 'dormir',     label: 'DORMIR',         emoji: '🛏️', color: 'noun', categoryId: 'routine' },
  { id: 'jantar',     label: 'JANTAR',         emoji: '🌙',  color: 'noun', categoryId: 'routine' },

  // ── ESCOLA (conteúdo do professor — populado via API) ────────────
  // Preenchido dinamicamente pelo backend quando o professor fizer upload
]
