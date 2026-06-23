-- Inicialização do banco de dados TEA Platform
-- Executado automaticamente na primeira criação do container

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- gen_random_uuid(), crypt()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- busca por similaridade de texto
CREATE EXTENSION IF NOT EXISTS "unaccent";    -- busca sem acentuação

-- Configurações de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- loga queries > 1s

SELECT pg_reload_conf();

\echo 'Banco de dados TEA Platform inicializado com sucesso.'
