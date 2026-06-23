-- Migration: 20260416000003_create_children
-- Cria tabela de crianças e relacionamentos com adultos

CREATE TYPE communication_level AS ENUM ('VERBAL', 'SEMI_VERBAL', 'NON_VERBAL');
CREATE TYPE sensory_profile AS ENUM ('HYPERSENSITIVE', 'HYPOSENSITIVE', 'MIXED');

CREATE TABLE IF NOT EXISTS children (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name             VARCHAR(200) NOT NULL,
  birth_date            DATE NOT NULL,
  avatar_url            TEXT,
  pin_hash              VARCHAR(72) NOT NULL,
  tea_profile           JSONB NOT NULL DEFAULT '{}',
  communication_level   communication_level NOT NULL DEFAULT 'VERBAL',
  sensory_profile       sensory_profile,
  preferred_modalities  TEXT[] NOT NULL DEFAULT '{}',
  notes                 TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_by            UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  school_id             UUID REFERENCES schools(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Relacionamento N:N — Professor ↔ Criança
CREATE TABLE IF NOT EXISTS teacher_children (
  teacher_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id    UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (teacher_id, child_id)
);

-- Relacionamento N:N — Responsável ↔ Criança
CREATE TABLE IF NOT EXISTS parent_children (
  parent_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id     UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  relationship VARCHAR(50),
  is_primary   BOOLEAN NOT NULL DEFAULT false,
  linked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (parent_id, child_id)
);

CREATE INDEX idx_children_active ON children(is_active) WHERE is_active = true;
CREATE INDEX idx_children_school ON children(school_id) WHERE school_id IS NOT NULL;
CREATE INDEX idx_children_tea_profile ON children USING GIN (tea_profile);
CREATE INDEX idx_teacher_children_teacher ON teacher_children(teacher_id);
CREATE INDEX idx_teacher_children_child ON teacher_children(child_id);
CREATE INDEX idx_parent_children_parent ON parent_children(parent_id);

COMMENT ON TABLE children IS 'Crianças cadastradas na plataforma';
COMMENT ON COLUMN children.pin_hash IS 'Hash bcrypt do PIN de 4 dígitos — nunca retornar na API';
COMMENT ON COLUMN children.tea_profile IS 'Perfil clínico TEA estruturado (JSONB flexível)';
COMMENT ON COLUMN children.preferred_modalities IS 'Modalidades preferidas: visual, auditory, tactile';
COMMENT ON TABLE teacher_children IS 'Vínculo entre professor e seus alunos';
COMMENT ON TABLE parent_children IS 'Vínculo entre responsável e seus filhos';
