# TEA Platform — Guia para Claude Code

Plataforma educacional para crianças com Transtorno do Espectro Autista (TEA).
Projeto: Coração Feliz | Desenvolvedor: joelson@coracaofeliz.com

---

## Estrutura do Projeto

Monorepo com npm workspaces:

| Pacote | Tecnologia | Propósito |
|---|---|---|
| `backend` | Node.js + Fastify + TypeScript | API REST, lógica de negócio, banco de dados |
| `frontend-web` | React 18 + Vite + TypeScript | Interface para Professor e Responsável |
| `frontend-mobile` | React Native + Expo | Interface para Criança (TEA-first) |
| `shared` | TypeScript puro | Tipos, constantes e schemas compartilhados |

---

## Convenções de Código

### TypeScript
- `strict: true` em todos os tsconfig
- Sem `any` — use `unknown` e faça narrowing
- Tipos de retorno explícitos em funções públicas de serviços e repositórios
- Interfaces para contratos externos (DTOs, respostas de API)
- Types para unions e aliases internos

### Nomenclatura
- Arquivos: `kebab-case.ts` (ex: `auth.service.ts`)
- Classes: `PascalCase`
- Funções e variáveis: `camelCase`
- Constantes globais: `UPPER_SNAKE_CASE`
- Enums: `PascalCase` com valores `UPPER_SNAKE_CASE`
- Tabelas do banco: `snake_case` (ex: `activity_assignments`)

### Backend — Padrão de Módulos

Cada módulo segue a estrutura:
```
module/
  module.controller.ts   — recebe HTTP, valida DTO, chama service
  module.service.ts      — lógica de negócio, orquestra repositórios
  module.repository.ts   — acesso ao banco, queries SQL
  module.routes.ts       — registra rotas no Fastify com schemas
  dto/                   — schemas Zod para validação de entrada
```

**Regra crítica**: Services nunca fazem queries diretas ao banco.
Controllers nunca contêm lógica de negócio.

### Backend — Tratamento de Erros

Usar classes de erro tipadas em `src/core/errors/`:
```typescript
throw new NotFoundError('Child', childId)
throw new ForbiddenError('Você não tem acesso a esta criança')
throw new ValidationError(zodError)
```

O middleware `error-handler.middleware.ts` converte para respostas HTTP padronizadas.

### Backend — Resposta Padrão da API

```typescript
// Sucesso
{ data: T, meta?: PaginationMeta }

// Erro
{ error: { code: string, message: string, details?: unknown } }
```

### Frontend Web — Regras

- Chamadas à API **somente** em `src/api/*.api.ts` — nunca em componentes
- Estado de servidor via React Query — não duplicar no Zustand
- Zustand apenas para estado UI e de sessão (auth, seleção atual)
- Componentes em `shared/components/ui` sem lógica de negócio
- Feature-first: cada feature é auto-contida (page + components + hooks locais)

### Frontend Mobile — Regras TEA-first

- **Nunca calcular score no app** — sempre enviar raw data ao backend
- **Máximo 3 elementos interativos por tela**
- Botões com `minHeight: 64px` e `minWidth: 64px`
- Feedback tátil (haptic) em TODA interação positiva
- Sem animações rápidas ou piscando (pode causar sobrecarga sensorial)
- Execuções salvas localmente antes de enviar (suporte offline obrigatório)
- Paleta restrita: apenas cores da `config/theme.ts`

---

## Banco de Dados

- PostgreSQL 16
- Migrations em `backend/src/core/database/migrations/`
- Nomenclatura de migration: `YYYYMMDDHHMMSS_descricao_da_migration.sql`
- Nunca alterar migrations já aplicadas — criar nova migration
- Seeds apenas para dados de desenvolvimento em `seeds/`

### Rodar migrations
```bash
npm run db:migrate
```

---

## Variáveis de Ambiente

Arquivo `.env` na raiz do `backend/`. Nunca commitar `.env`.
Exemplo em `backend/.env.example`.

Variáveis obrigatórias:
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET=...
R2_ENDPOINT=...
FIREBASE_SERVER_KEY=...
```

---

## Infraestrutura Local

```bash
# Subir PostgreSQL + Redis
npm run infra:up

# Parar
npm run infra:down

# Reset completo (apaga dados)
npm run infra:reset
```

PostgreSQL: `localhost:5432` | banco: `tea_platform` | user: `tea_user`
Redis: `localhost:6379`

---

## Perfis de Usuário

| Role | Acesso |
|---|---|
| `TEACHER` | Cria crianças, atividades, assignments. Vê progresso de seus alunos |
| `PARENT` | Vê filhos vinculados e progresso. Não cria atividades |
| `CHILD` | Executa atividades atribuídas. Token separado via PIN |
| `ADMIN` | Gestão de usuários e escola. Não interage com atividades |

---

## Domínios TEA no Sistema

```typescript
type TeaDomain = 'COGNITIVE' | 'COMMUNICATION' | 'EMOTIONAL' | 'SOCIAL' | 'ROUTINE'
```

Toda atividade deve ser classificada em exatamente um domínio.

---

## Tipos de Atividade

```typescript
type ActivityType =
  | 'MATCHING'              // Associar pares (imagem↔imagem, imagem↔texto)
  | 'SEQUENCE'              // Ordenar etapas de uma rotina
  | 'EMOTION_RECOGNITION'   // Identificar expressão facial
  | 'COMMUNICATION'         // Selecionar intenção comunicativa (PECS-like)
  | 'ROUTINE'               // Seguir checklist de rotina
  | 'SOCIAL_STORY'          // Leitura guiada de situação social
```

---

## Roadmap

- **Fase 1** (atual): Fundação, estrutura, Docker, migrations
- **Fase 2**: Backend — Auth, Users, Children, Activities, Assignments, Executions
- **Fase 3**: Frontend Web — Dashboard Professor e Pais, Activity Builder
- **Fase 4**: Mobile — App da criança com suporte offline
- **Fase 5**: IA adaptativa com Claude API

---

## Não Fazer

- Não usar `console.log` em produção — usar o logger Pino
- Não retornar `password_hash` ou `pin_hash` em nenhuma resposta de API
- Não fazer queries SQL em controllers ou em componentes React
- Não armazenar tokens de autenticação de crianças persistentemente no dispositivo
- Não usar animações com frequência > 2Hz na interface mobile
- Não criar migrations destrutivas sem backup confirmado
