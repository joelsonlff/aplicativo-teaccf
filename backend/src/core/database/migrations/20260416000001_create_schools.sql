-- Migration: 20260416000001_create_schools
-- Cria tabela de escolas (suporte multi-tenant futuro)

CREATE TABLE IF NOT EXISTS schools (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(200) NOT NULL,
  cnpj        VARCHAR(20) UNIQUE,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schools_active ON schools(is_active) WHERE is_active = true;

COMMENT ON TABLE schools IS 'Escolas e instituições cadastradas na plataforma';
COMMENT ON COLUMN schools.cnpj IS 'CNPJ da instituição — opcional para escolas públicas';
