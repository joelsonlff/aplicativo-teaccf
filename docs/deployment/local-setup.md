# Setup Local — TEA Platform

## Pré-requisitos

- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker Desktop
- Git

## 1. Clonar e instalar dependências

```bash
git clone <repositório>
cd "Aplicativo de TEACCF"
npm install
```

## 2. Configurar variáveis de ambiente

```bash
cp backend/.env.example backend/.env
# Editar backend/.env com suas configurações locais
```

Para desenvolvimento local os valores default funcionam sem alteração.

## 3. Subir infraestrutura (PostgreSQL + Redis)

```bash
npm run infra:up
```

Aguardar os containers ficarem healthy:
```bash
docker compose ps
```

## 4. Rodar migrations

```bash
npm run db:migrate
```

## 5. Popular dados de desenvolvimento

```bash
npm run db:seed
```

Credenciais criadas:
- Professor: `professor@demo.com` / `demo123456`
- Responsável: `responsavel@demo.com` / `demo123456`
- Criança (PIN): `1234`

## 6. Iniciar servidores de desenvolvimento

```bash
# Backend + Frontend Web em paralelo
npm run dev

# Ou individualmente:
npm run dev:backend    # http://localhost:3000
npm run dev:web        # http://localhost:5173

# Mobile (Fase 4)
cd frontend-mobile && npm run start
```

## Documentação da API

Disponível em: http://localhost:3000/docs (Swagger UI)

## PgAdmin (opcional)

```bash
docker compose --profile tools up -d
# Acesse: http://localhost:5050
# Email: joelson@coracaofeliz.com | Senha: admin123
```

## Parar tudo

```bash
npm run infra:down
# Ctrl+C nos processos de desenvolvimento
```

## Reset completo (apaga dados)

```bash
npm run infra:reset
npm run db:migrate
npm run db:seed
```
