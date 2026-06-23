-- Migration: 20260416000004_create_activities
-- Cria tabelas de atividades, atribuições e execuções

CREATE TYPE activity_type AS ENUM (
  'MATCHING',
  'SEQUENCE',
  'EMOTION_RECOGNITION',
  'COMMUNICATION',
  'ROUTINE',
  'SOCIAL_STORY'
);

CREATE TYPE tea_domain AS ENUM (
  'COGNITIVE',
  'COMMUNICATION',
  'EMOTIONAL',
  'SOCIAL',
  'ROUTINE'
);

CREATE TABLE IF NOT EXISTS activities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             VARCHAR(200) NOT NULL,
  description       TEXT,
  type              activity_type NOT NULL,
  domain            tea_domain NOT NULL,
  difficulty        SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  duration_seconds  INTEGER NOT NULL CHECK (duration_seconds > 0),
  instructions      TEXT NOT NULL,
  content           JSONB NOT NULL,
  media_urls        JSONB NOT NULL DEFAULT '{}',
  tags              TEXT[] NOT NULL DEFAULT '{}',
  is_template       BOOLEAN NOT NULL DEFAULT false,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_by        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  school_id         UUID REFERENCES schools(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Full-text search em português
CREATE INDEX idx_activities_fts ON activities
  USING GIN (to_tsvector('portuguese', title || ' ' || COALESCE(description, '')));

CREATE INDEX idx_activities_type_domain ON activities(type, domain, is_active)
  WHERE is_active = true;

CREATE INDEX idx_activities_template ON activities(is_template)
  WHERE is_template = true AND is_active = true;

CREATE INDEX idx_activities_difficulty ON activities(difficulty, domain);

CREATE INDEX idx_activities_tags ON activities USING GIN (tags);

COMMENT ON TABLE activities IS 'Atividades educacionais criadas pelos professores';
COMMENT ON COLUMN activities.content IS 'Estrutura da atividade — formato varia por type (JSONB)';
COMMENT ON COLUMN activities.is_template IS 'Templates ficam visíveis para todos os professores da plataforma';
COMMENT ON COLUMN activities.duration_seconds IS 'Tempo estimado — recalculado com base nas execuções reais';
