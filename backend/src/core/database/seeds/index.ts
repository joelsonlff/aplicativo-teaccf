// Seeds de desenvolvimento — nunca rodar em produção
// Cria dados básicos para testar o sistema localmente

import { connectDatabase, query, withTransaction } from '../database'

const seeds = [
  {
    name: 'Escola Coração Feliz',
    data: async () => {
      await query(`
        INSERT INTO schools (id, name, cnpj)
        VALUES ('00000000-0000-0000-0000-000000000001', 'Escola Coração Feliz', '00.000.000/0001-00')
        ON CONFLICT DO NOTHING
      `)
    },
  },
  {
    name: 'Professor demo',
    data: async () => {
      // Senha: demo123456 (bcrypt hash)
      await query(`
        INSERT INTO users (id, email, password_hash, full_name, role, school_id, email_verified)
        VALUES (
          '00000000-0000-0000-0000-000000000010',
          'professor@demo.com',
          '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj1z9kbL1tPO',
          'Professor Demo',
          'TEACHER',
          '00000000-0000-0000-0000-000000000001',
          true
        )
        ON CONFLICT DO NOTHING
      `)
    },
  },
  {
    name: 'Responsável demo',
    data: async () => {
      await query(`
        INSERT INTO users (id, email, password_hash, full_name, role, email_verified)
        VALUES (
          '00000000-0000-0000-0000-000000000011',
          'responsavel@demo.com',
          '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj1z9kbL1tPO',
          'Responsável Demo',
          'PARENT',
          true
        )
        ON CONFLICT DO NOTHING
      `)
    },
  },
  {
    name: 'Criança demo',
    data: async () => {
      // PIN: 1234 (bcrypt hash)
      await query(`
        INSERT INTO children (id, full_name, birth_date, pin_hash, communication_level, sensory_profile, tea_profile, created_by, school_id)
        VALUES (
          '00000000-0000-0000-0000-000000000020',
          'João Demo',
          '2016-03-15',
          '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj1z9kbL1tPO',
          'VERBAL',
          'HYPERSENSITIVE',
          '{"autismLevel": "LEVEL_1", "therapies": ["ABA", "Fonoaudiologia"], "reinforcementType": "VISUAL", "cognitiveDomains": {"attentionSpan": "MEDIUM", "workingMemory": "LOW", "processingSpeed": "MEDIUM", "socialCognition": "LOW"}, "behavioralTriggers": ["Sons altos", "Transições bruscas"]}',
          '00000000-0000-0000-0000-000000000010',
          '00000000-0000-0000-0000-000000000001'
        )
        ON CONFLICT DO NOTHING
      `)

      await query(`
        INSERT INTO teacher_children (teacher_id, child_id)
        VALUES ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020')
        ON CONFLICT DO NOTHING
      `)

      await query(`
        INSERT INTO parent_children (parent_id, child_id, relationship, is_primary)
        VALUES ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000020', 'father', true)
        ON CONFLICT DO NOTHING
      `)
    },
  },
]

async function runSeeds() {
  await connectDatabase()
  console.log('[Seeds] Iniciando seeds de desenvolvimento...')

  await withTransaction(async (_client) => {
    for (const seed of seeds) {
      console.log(`[Seeds] Executando: ${seed.name}`)
      await seed.data()
    }
  })

  console.log('[Seeds] Seeds concluídos com sucesso.')
  console.log('\nCredenciais de acesso:')
  console.log('  Professor: professor@demo.com / demo123456')
  console.log('  Responsável: responsavel@demo.com / demo123456')
  console.log('  Criança PIN: 1234')

  process.exit(0)
}

runSeeds().catch((error) => {
  console.error('[Seeds] Erro:', error)
  process.exit(1)
})
