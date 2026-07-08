// Seeds de desenvolvimento — nunca rodar em produção
// Cria dados básicos para testar o sistema localmente

import bcrypt from 'bcryptjs'
import { connectDatabase, query, withTransaction } from '../database'

// Hashes gerados em tempo de execução — um hash fixo no código quebra
// silenciosamente se não corresponder à senha documentada
const DEMO_PASSWORD_HASH = bcrypt.hashSync('demo123456', 12)
const DEMO_PIN_HASH      = bcrypt.hashSync('1234', 12)

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
      // Senha: demo123456
      await query(`
        INSERT INTO users (id, email, password_hash, full_name, role, school_id, email_verified)
        VALUES (
          '00000000-0000-0000-0000-000000000010',
          'professor@demo.com',
          $1,
          'Professor Demo',
          'TEACHER',
          '00000000-0000-0000-0000-000000000001',
          true
        )
        ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash
      `, [DEMO_PASSWORD_HASH])
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
          $1,
          'Responsável Demo',
          'PARENT',
          true
        )
        ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash
      `, [DEMO_PASSWORD_HASH])
    },
  },
  {
    name: 'Criança demo',
    data: async () => {
      // PIN: 1234
      await query(`
        INSERT INTO children (id, full_name, birth_date, pin_hash, communication_level, sensory_profile, tea_profile, created_by, school_id)
        VALUES (
          '00000000-0000-0000-0000-000000000020',
          'João Demo',
          '2016-03-15',
          $1,
          'VERBAL',
          'HYPERSENSITIVE',
          '{"autismLevel": "LEVEL_1", "therapies": ["ABA", "Fonoaudiologia"], "reinforcementType": "VISUAL", "cognitiveDomains": {"attentionSpan": "MEDIUM", "workingMemory": "LOW", "processingSpeed": "MEDIUM", "socialCognition": "LOW"}, "behavioralTriggers": ["Sons altos", "Transições bruscas"]}',
          '00000000-0000-0000-0000-000000000010',
          '00000000-0000-0000-0000-000000000001'
        )
        ON CONFLICT (id) DO UPDATE SET pin_hash = EXCLUDED.pin_hash
      `, [DEMO_PIN_HASH])

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
  {
    name: 'Pacote inicial de atividades (uma de cada tipo)',
    data: async () => {
      const teacherId = '00000000-0000-0000-0000-000000000010'
      const schoolId  = '00000000-0000-0000-0000-000000000001'

      const activities = [
        {
          id: '00000000-0000-0000-0000-000000000101',
          title: 'Animais e seus sons',
          description: 'Associar cada animal ao som que ele faz.',
          type: 'MATCHING', domain: 'COGNITIVE', difficulty: 1, duration: 180,
          instructions: 'Toque em um animal e depois no som que ele faz.',
          content: {
            instruction: 'Encontre o som de cada animal',
            pairs: [
              { id: 'p1', prompt: '🐶 Cachorro', answer: 'Au au' },
              { id: 'p2', prompt: '🐱 Gato',     answer: 'Miau' },
              { id: 'p3', prompt: '🐮 Vaca',     answer: 'Muu' },
              { id: 'p4', prompt: '🦆 Pato',     answer: 'Quá quá' },
            ],
          },
          tags: ['animais', 'sons', 'iniciante'],
        },
        {
          id: '00000000-0000-0000-0000-000000000102',
          title: 'Lavar as mãos',
          description: 'Ordenar as etapas de lavar as mãos corretamente.',
          type: 'SEQUENCE', domain: 'ROUTINE', difficulty: 2, duration: 240,
          instructions: 'Toque nas etapas na ordem certa para lavar as mãos.',
          content: {
            instruction: 'Vamos lavar as mãos! O que fazemos primeiro?',
            steps: [
              { id: 's1', text: 'Abrir a torneira',    emoji: '🚰', order: 1 },
              { id: 's2', text: 'Passar sabonete',     emoji: '🧼', order: 2 },
              { id: 's3', text: 'Esfregar as mãos',    emoji: '🙌', order: 3 },
              { id: 's4', text: 'Enxaguar com água',   emoji: '💦', order: 4 },
              { id: 's5', text: 'Secar com a toalha',  emoji: '🧻', order: 5 },
            ],
          },
          tags: ['higiene', 'rotina', 'autonomia'],
        },
        {
          id: '00000000-0000-0000-0000-000000000103',
          title: 'Como ela está se sentindo?',
          description: 'Reconhecer emoções básicas: feliz, triste e bravo.',
          type: 'EMOTION_RECOGNITION', domain: 'EMOTIONAL', difficulty: 1, duration: 180,
          instructions: 'Olhe para o rosto e toque no nome do sentimento.',
          content: {
            instruction: 'Como essa pessoa está se sentindo?',
            emotions: [
              { id: 'e1', label: 'Feliz',  emoji: '😄' },
              { id: 'e2', label: 'Triste', emoji: '😢' },
              { id: 'e3', label: 'Bravo',  emoji: '😠' },
            ],
          },
          tags: ['emoções', 'iniciante'],
        },
        {
          id: '00000000-0000-0000-0000-000000000104',
          title: 'O que você quer?',
          description: 'Comunicação expressiva: a criança toca no cartão e o app fala por ela. Sem certo ou errado.',
          type: 'COMMUNICATION', domain: 'COMMUNICATION', difficulty: 1, duration: 120,
          instructions: 'A criança toca no cartão do que quer e o app fala a escolha.',
          content: {
            instruction: 'O que você quer? Toque no cartão',
            options: [
              { id: 'o1', label: 'Quero água',    emoji: '💧' },
              { id: 'o2', label: 'Quero comer',   emoji: '🍎' },
              { id: 'o3', label: 'Quero brincar', emoji: '🧸' },
            ],
          },
          tags: ['caa', 'pecs', 'comunicação'],
        },
        {
          id: '00000000-0000-0000-0000-000000000105',
          title: 'Hora de dormir',
          description: 'Rotina noturna guiada, uma tarefa por vez.',
          type: 'ROUTINE', domain: 'ROUTINE', difficulty: 1, duration: 300,
          instructions: 'A criança marca cada tarefa da rotina como feita.',
          content: {
            instruction: 'Hora de dormir! Vamos fazer um passo de cada vez',
            tasks: [
              { id: 't1', label: 'Guardar os brinquedos', emoji: '🧸' },
              { id: 't2', label: 'Escovar os dentes',     emoji: '🪥' },
              { id: 't3', label: 'Vestir o pijama',       emoji: '🩳' },
              { id: 't4', label: 'Deitar na cama',        emoji: '🛏️' },
            ],
          },
          tags: ['rotina', 'sono', 'autonomia'],
        },
        {
          id: '00000000-0000-0000-0000-000000000106',
          title: 'Esperar a minha vez',
          description: 'História social sobre esperar a vez de brincar.',
          type: 'SOCIAL_STORY', domain: 'SOCIAL', difficulty: 2, duration: 240,
          instructions: 'Leia a história com a criança. O app narra cada quadro.',
          content: {
            instruction: 'Vamos ler uma história juntos',
            slides: [
              { id: 'sl1', text: 'Na escola, às vezes eu quero brincar com um brinquedo que outro amigo está usando.', emoji: '🏫' },
              { id: 'sl2', text: 'Eu posso esperar a minha vez. Esperar é difícil, mas eu consigo.',                    emoji: '⏳' },
              { id: 'sl3', text: 'Enquanto espero, posso respirar fundo ou brincar com outra coisa.',                   emoji: '😮‍💨' },
              { id: 'sl4', text: 'Quando chega a minha vez, eu fico feliz. Esperar a vez é ser um bom amigo!',          emoji: '🤝' },
            ],
          },
          tags: ['história social', 'espera', 'convivência'],
        },
      ]

      for (const a of activities) {
        await query(
          `INSERT INTO activities
             (id, title, description, type, domain, difficulty, duration_seconds,
              instructions, content, media_urls, tags, is_template, created_by, school_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'{}',$10,true,$11,$12)
           ON CONFLICT DO NOTHING`,
          [
            a.id, a.title, a.description, a.type, a.domain, a.difficulty, a.duration,
            a.instructions, JSON.stringify(a.content), a.tags, teacherId, schoolId,
          ],
        )
      }
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
