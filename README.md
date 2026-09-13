# Origo

**Origo** é uma plataforma HEP (Home Exercise Program) 1:1 para fisioterapeutas, personal trainers e seus alunos.

## 🎯 Status do Projeto

Este repositório contém a **infraestrutura base** (W0.4 + W0.5 stub) para permitir que outros squads implementem features de autenticação e produto.

**O que está pronto:**
- ✅ API Fastify 5 + TypeScript
- ✅ Postgres 16 (via Docker, porta 5435)
- ✅ Prisma 6 ORM
- ✅ Mailhog para testes SMTP
- ✅ Health check (`GET /health`)
- ✅ Docker Compose para desenvolvimento local
- ✅ CI básico (typecheck + build)
- ✅ **Autenticação P0** (login, JWT, forgot-password com reset via email)
- ✅ **apps/web** (Next.js frontend com telas de login/cadastro/reset)

**O que NÃO está implementado (propositalmente):**
- ❌ Endpoints de negócio (HEP, sessões, exercícios)
- ❌ Apps mobile (iOS/Android) — Squad **MOBILE**

---

## 🚀 Setup Rápido (< 30 min)

### Portas em Desenvolvimento

| Serviço         | Porta |
|-----------------|-------|
| API             | 3001  |
| Postgres        | 5435  |
| Mailhog Web UI  | 8025  |
| Mailhog SMTP    | 1025  |
| Web (Next.js)   | 3456  |

### Pré-requisitos

- **Node.js 20+** ([https://nodejs.org](https://nodejs.org))
- **Docker + Docker Compose** ([https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/))

### Instalação

```bash
# 1. Clone o repo
git clone <repo-url>
cd origo

# 2. Rode o script de setup (instala deps, sobe Docker, roda migrations)
./scripts/setup.sh

# 3. Inicie a API em modo dev
npm run api:dev

# 4. Em outro terminal, inicie o frontend
npm run web:dev
```

A API estará rodando em **http://localhost:3001**  
O frontend estará em **http://localhost:3456**

**Para testar login local**, veja credenciais de seed em [DEMO_LOCAL.md](DEMO_LOCAL.md).

### Verificar

```bash
# Health check
curl -s http://localhost:3001/health | jq
# Deve retornar: { "status": "ok", "timestamp": "...", "database": "connected" }

# API info
curl -s http://localhost:3001/api/v1 | jq
```

---

## 📦 Estrutura do Monorepo

```
origo/
├── apps/
│   ├── api/              # Fastify 5 API (TypeScript)
│   ├── ios/              # Placeholder - SwiftUI (futuro)
│   └── android/          # Placeholder - Jetpack Compose (futuro)
├── libs/
│   ├── api-contract/     # OpenAPI 3.x spec
│   ├── design-tokens/    # Placeholder - tokens de design
│   └── mobile-content/   # Placeholder - strings pt-BR
├── docs/
│   └── greenfield/       # Notas sobre o projeto greenfield
├── deploy/
│   └── docker-compose.yml
├── scripts/
│   └── setup.sh          # Setup automático
└── .github/workflows/
    └── ci.yml            # CI: typecheck + build
```

---

## 🐳 Docker Services

Gerenciados via `deploy/docker-compose.yml`:

| Service   | Porta Host | Porta Container | Descrição                      |
|-----------|------------|-----------------|--------------------------------|
| postgres  | 5435       | 5432            | PostgreSQL 16                  |
| mailhog   | 8025       | 8025            | Mailhog Web UI                 |
| mailhog   | 1025       | 1025            | Mailhog SMTP server            |

### Comandos úteis

```bash
# Subir todos os services
docker compose -f deploy/docker-compose.yml up -d

# Ver logs
docker compose -f deploy/docker-compose.yml logs -f

# Parar
docker compose -f deploy/docker-compose.yml down

# Parar e remover volumes (⚠️ apaga DB)
docker compose -f deploy/docker-compose.yml down -v
```

### Acessar Mailhog

Mailhog captura emails enviados pela API (útil para testar forgot-password depois):

- **Web UI:** [http://localhost:8025](http://localhost:8025)
- **SMTP:** `localhost:1025` (sem auth)

---

## 🛠️ Comandos NPM

```bash
# Instalar dependências
npm install

# Iniciar API em modo dev (hot reload)
npm run api:dev

# Build da API
npm run api:build

# Typecheck (todos os workspaces)
npm run typecheck

# Gerar Prisma client
cd apps/api && npx prisma generate

# Rodar migrations
cd apps/api && npx prisma migrate dev

# Abrir Prisma Studio (GUI para DB)
cd apps/api && npx prisma studio
```

---

## 🌐 Endpoints da API

### Health Check (não autenticado)

```bash
GET /health
```

**Resposta (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-09-12T04:10:00.000Z",
  "database": "connected"
}
```

### API v1 Info (stub)

```bash
GET /api/v1
```

**Resposta (200):**
```json
{
  "message": "Origo API v1",
  "version": "0.1.0",
  "note": "Auth endpoints (login, forgot-password) serão implementados pelo squad BACKEND"
}
```

**NOTA:** Endpoints autenticados (`/api/v1/auth/*`, `/api/v1/hep/*`, etc) serão implementados pelos squads BACKEND e PRODUTO.

---

## 📝 Variáveis de Ambiente

Copie `.env.example` para `.env` (feito automaticamente por `setup.sh`):

```bash
cp .env.example .env
```

**Principais variáveis:**

| Variável      | Padrão                          | Descrição                        |
|---------------|---------------------------------|----------------------------------|
| PORT          | 3001                            | Porta da API                     |
| DATABASE_URL  | postgresql://...@localhost:5435 | Connection string do Postgres    |
| SMTP_HOST     | localhost                       | Servidor SMTP (Mailhog)          |
| SMTP_PORT     | 1025                            | Porta SMTP                       |
| LOG_LEVEL     | info                            | Nível de log (debug, info, warn) |

---

## 🧪 CI/CD

CI configurado em `.github/workflows/ci.yml`:

- ✅ Instala dependências
- ✅ Gera Prisma client
- ✅ Roda typecheck
- ✅ Builda API
- ✅ Verifica que `/health` existe no código

---

## 🗺️ Próximos Passos

### Squad MOBILE

Implementar apps nativos:
- iOS (SwiftUI) em `apps/ios/`
- Android (Jetpack Compose) em `apps/android/`
- Integração com API Origo
- Telas de login/cadastro

### Squad PRODUTO + DESIGN

Definir:
- Design tokens em `libs/design-tokens/`
- Conteúdo pt-BR em `libs/mobile-content/`

---

## 📚 Documentação Adicional

- [Greenfield Notes](docs/greenfield/README.md) — Contexto do projeto
- [API Contract](libs/api-contract/README.md) — Especificação OpenAPI
- [OpenAPI Spec](libs/api-contract/openapi.yaml) — Endpoints documentados

---

## 🤝 Contribuindo

1. Crie uma branch a partir de `main`
2. Faça suas alterações
3. Rode `npm run typecheck` e `npm run build`
4. Abra um Pull Request

---

## 📄 Licença

Privado — Uso interno apenas.

---

## 🆘 Troubleshooting

### Porta 5435 já em uso

```bash
# Descobrir processo usando a porta
lsof -i :5435

# Parar o Docker Compose e tentar novamente
docker compose -f deploy/docker-compose.yml down
docker compose -f deploy/docker-compose.yml up -d
```

### Erro "Can't reach database server"

```bash
# Verificar se Postgres está rodando
docker compose -f deploy/docker-compose.yml ps

# Ver logs do Postgres
docker compose -f deploy/docker-compose.yml logs postgres

# Testar conexão direta
psql postgresql://origo:origo_dev_password@localhost:5435/origo_dev
```

### Prisma errors após mudanças no schema

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev
```

---

**Dúvidas?** Abra uma issue ou consulte a equipe de infraestrutura.
