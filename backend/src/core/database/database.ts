import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg'
import { dbConfig } from '../../config/app.config'

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) throw new Error('Pool de banco de dados não inicializado. Chame connectDatabase() primeiro.')
  return pool
}

export async function connectDatabase(): Promise<void> {
  pool = new Pool({
    connectionString: dbConfig.url,
    min: dbConfig.poolMin,
    max: dbConfig.poolMax,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  })

  // Testa a conexão
  const client = await pool.connect()
  try {
    await client.query('SELECT 1')
    console.log('[Database] Conectado ao PostgreSQL com sucesso')
  } finally {
    client.release()
  }

  // Trata erros inesperados do pool
  pool.on('error', (err) => {
    console.error('[Database] Erro inesperado no pool:', err)
  })
}

export async function disconnectDatabase(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    console.log('[Database] Conexão encerrada')
  }
}

// Helper para queries simples
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[]
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, values)
}

// Helper para transações
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
