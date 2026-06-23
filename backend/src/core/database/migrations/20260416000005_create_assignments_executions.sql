-- Migration: 20260416000005_create_assignments_executions
-- Cria tabelas de atribuições de atividades e execuções

CREATE TYPE assignment_status AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'EXPIRED',
  'SKIPPED'
);

CREATE TABLE IF NOT EXISTS activity_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id     UUID NOT NULL REFERENCES activities(id) ON DELETE RESTRICT,
  child_id        UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  assigned_by     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status          assignment_status NOT NULL DEFAULT 'PENDING',
  due_date        TIMESTAMPTZ,
  order_index     INTEGER NOT NULL DEFAULT 0,
  custom_params   JSONB NOT NULL DEFAULT '{}',
  notes           TEXT,
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,

  CONSTRAINT check_completed_at CHECK (
    (status = 'COMPLETED' AND completed_at IS NOT NULL) OR
    (status != 'COMPLETED')
  )
);

-- Query mais comum: fila pendente da criança
CREATE INDEX idx_assignments_child_pending ON activity_assignments(child_id, order_index)
  WHERE status IN ('PENDING', 'IN_PROGRESS');

CREATE INDEX idx_assignments_child_status ON activity_assignments(child_id, status);
CREATE INDEX idx_assignments_due_date ON activity_assignments(due_date)
  WHERE due_date IS NOT NULL AND status = 'PENDING';

COMMENT ON TABLE activity_assignments IS 'Atribuição de atividades para crianças específicas';
COMMENT ON COLUMN activity_assignments.custom_params IS 'Override de parâmetros da atividade por criança (JSONB)';
COMMENT ON COLUMN activity_assignments.order_index IS 'Ordem de exibição na fila do app mobile';

-- Execuções
CREATE TABLE IF NOT EXISTS activity_executions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id     UUID NOT NULL REFERENCES activity_assignments(id) ON DELETE RESTRICT,
  child_id          UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  started_at        TIMESTAMPTZ NOT NULL,
  completed_at      TIMESTAMPTZ,
  duration_seconds  INTEGER CHECK (duration_seconds > 0),
  score             DECIMAL(5,2) CHECK (score BETWEEN 0 AND 100),
  accuracy          DECIMAL(5,2) CHECK (accuracy BETWEEN 0 AND 100),
  attempts          SMALLINT NOT NULL DEFAULT 1 CHECK (attempts > 0),
  response_data     JSONB NOT NULL,
  behavioral_notes  TEXT,
  was_assisted      BOOLEAN NOT NULL DEFAULT false,
  device_info       JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_executions_assignment ON activity_executions(assignment_id);
CREATE INDEX idx_executions_child_date ON activity_executions(child_id, created_at DESC);

COMMENT ON TABLE activity_executions IS 'Registro detalhado de cada execução de atividade';
COMMENT ON COLUMN activity_executions.score IS 'Calculado pelo backend — nunca aceitar do mobile';
COMMENT ON COLUMN activity_executions.response_data IS 'Dados brutos por passo: tempo de reação, acertos, pausas';
COMMENT ON COLUMN activity_executions.was_assisted IS 'True quando adulto auxiliou — afeta cálculo de progresso';
