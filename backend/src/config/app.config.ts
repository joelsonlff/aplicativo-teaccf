function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Variável de ambiente obrigatória não definida: ${key}`)
  return value
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

export const appConfig = {
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  isDevelopment: optionalEnv('NODE_ENV', 'development') === 'development',
  isProduction: process.env['NODE_ENV'] === 'production',
  port: parseInt(optionalEnv('PORT', '3000'), 10),
  host: optionalEnv('HOST', '0.0.0.0'),
  logLevel: optionalEnv('LOG_LEVEL', 'info'),
} as const

export const dbConfig = {
  url: optionalEnv('DATABASE_URL', 'postgresql://tea_user:tea_pass@localhost:5432/tea_platform'),
  poolMin: parseInt(optionalEnv('DATABASE_POOL_MIN', '2'), 10),
  poolMax: parseInt(optionalEnv('DATABASE_POOL_MAX', '10'), 10),
} as const

export const supabaseConfig = {
  url: optionalEnv('SUPABASE_URL', ''),
  anonKey: optionalEnv('SUPABASE_ANON_KEY', ''),
  serviceRoleKey: optionalEnv('SUPABASE_SERVICE_ROLE_KEY', ''),
  storageBucket: optionalEnv('SUPABASE_STORAGE_BUCKET', 'media'),
} as const

export const jwtConfig = {
  secret: optionalEnv('JWT_SECRET', 'dev-secret-mude-em-producao-32chars!!'),
  expiresIn: optionalEnv('JWT_EXPIRES_IN', '15m'),
  refreshSecret: optionalEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret-mude-em-producao!!'),
  refreshExpiresIn: optionalEnv('JWT_REFRESH_EXPIRES_IN', '30d'),
} as const

export const geminiConfig = {
  apiKeys: [
    optionalEnv('GEMINI_API_KEY', ''),
    optionalEnv('GEMINI_API_KEY_2', ''),
  ].filter(Boolean),
  model: optionalEnv('GEMINI_MODEL', 'gemini-1.5-flash'),
} as const

export const corsConfig = {
  origins: optionalEnv('CORS_ORIGINS', '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
} as const

// Valida apenas em produção para não bloquear desenvolvimento
if (appConfig.isProduction) {
  requireEnv('JWT_SECRET')
  requireEnv('JWT_REFRESH_SECRET')
  requireEnv('DATABASE_URL')
  requireEnv('SUPABASE_URL')
  requireEnv('SUPABASE_SERVICE_ROLE_KEY')
}
