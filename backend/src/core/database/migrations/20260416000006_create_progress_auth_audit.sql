-- Migration: 20260416000006_create_progress_auth_audit
-- Cria tabelas de progresso agregado, tokens de refresh e auditoria

CREATE TABLE IF NOT EXISTS child_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id          UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  period            DATE NOT NULL,
  domain            tea_domain NOT NULL,
  activities_total  INTEGER NOT NULL DEFAULT 0,
  activities_done   INTEGER NOT NULL DEFAULT 0,
  avg_score         DECIMAL(5,2),
  avg_accuracy      DECIMAL(5,2),
  avg_duration_s    INTEGER,
  difficulty_trend  DECIMAL(3,2),   -- -1.0 a +1.0
  computed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (child_id, period, domain)
);

CREATE INDEX idx_progress_child_period ON child_progress(child_id, period DESC);
CREATE INDEX idx_progress_domain ON child_progress(domain, period DESC);

COMMENT ON TABLE child_progress IS 'Progresso semanal agregado por domínio TEA (gerado por job noturno)';
COMMENT ON COLUMN child_progress.period IS 'Primeiro dia da semana — agrupamento semanal';
COMMENT ON COLUMN child_progress.difficulty_trend IS '+1.0 = grande progresso, -1.0 = grande regressão';

-- Tokens de refresh
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  child_id    UUID REFERENCES children(id) ON DELETE CASCADE,
  token_hash  VARCHAR(72) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  device_info JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT check_token_owner CHECK (
    (user_id IS NOT NULL AND child_id IS NULL) OR
    (user_id IS NULL AND child_id IS NOT NULL)
  )
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id)
  WHERE user_id IS NOT NULL AND revoked_at IS NULL;

CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at)
  WHERE revoked_at IS NULL;

COMMENT ON TABLE refresh_tokens IS 'Tokens de refresh com suporte a revogação individual por dispositivo';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'SHA-256 do token — nunca armazenar token raw';

-- Log de auditoria (LGPD)
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID,
  actor_type  VARCHAR(20) CHECK (actor_type IN ('user', 'child', 'system')),
  action      VARCHAR(100) NOT NULL,
  resource    VARCHAR(100) NOT NULL,
  resource_id UUID,
  metadata    JSONB NOT NULL DEFAULT '{}',
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at DESC)
  WHERE actor_id IS NOT NULL;

CREATE INDEX idx_audit_resource ON audit_logs(resource, resource_id, created_at DESC);
CREATE INDEX idx_audit_date ON audit_logs(created_at DESC);

COMMENT ON TABLE audit_logs IS 'Log imutável de ações — compliance LGPD';
COMMENT ON COLUMN audit_logs.action IS 'Ex: child.created, execution.submitted, user.login';
