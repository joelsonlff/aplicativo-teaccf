-- Migration: 20260619000001_create_aac_symbols
-- Símbolos CAA personalizados criados por professores para cada criança

CREATE TABLE IF NOT EXISTS aac_symbols (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    UUID REFERENCES children(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  label       VARCHAR(100) NOT NULL,
  image_url   TEXT NOT NULL,
  category_id VARCHAR(50) NOT NULL DEFAULT 'teacher',
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aac_symbols_child ON aac_symbols(child_id, is_active)
  WHERE is_active = true;

CREATE INDEX idx_aac_symbols_teacher ON aac_symbols(created_by);

COMMENT ON TABLE aac_symbols IS 'Pictogramas CAA personalizados — uploads do professor para cada aluno';
COMMENT ON COLUMN aac_symbols.child_id IS 'NULL = símbolo compartilhado para toda a turma do professor';
COMMENT ON COLUMN aac_symbols.category_id IS 'Categoria no app: teacher, routine, food, etc.';
