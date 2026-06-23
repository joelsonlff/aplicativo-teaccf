-- Migration: 20260416000002_create_users
-- Cria tabela de usuários adultos (professor, responsável, admin)

CREATE TYPE user_role AS ENUM ('TEACHER', 'PARENT', 'ADMIN');

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(320) NOT NULL UNIQUE,
  password_hash   VARCHAR(72) NOT NULL,
  full_name       VARCHAR(200) NOT NULL,
  role            user_role NOT NULL,
  phone           VARCHAR(20),
  avatar_url      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  email_verified  BOOLEAN NOT NULL DEFAULT false,
  school_id       UUID REFERENCES schools(id) ON DELETE SET NULL,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_active ON users(role, is_active) WHERE is_active = true;
CREATE INDEX idx_users_school ON users(school_id) WHERE school_id IS NOT NULL;

COMMENT ON TABLE users IS 'Usuários adultos: professores, responsáveis e administradores';
COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt cost 12 — nunca retornar em respostas de API';
COMMENT ON COLUMN users.email_verified IS 'Email deve ser verificado antes do primeiro login';
