# Origo Greenfield Notes

Este é um projeto greenfield (novo, do zero) focado em validar a infraestrutura básica antes de implementar features.

## Fase atual: W0.4 + W0.5 (Infrastructure stub)

**Objetivo:** Levantar stack local com Docker para que outros squads possam implementar login e forgot-password.

**O que está pronto:**
- ✅ Postgres rodando (porta 5437)
- ✅ Fastify 5 API (porta 3001)
- ✅ Mailhog para testes SMTP (UI na porta 8025)
- ✅ Health check funcionando
- ✅ Prisma 6 com schema mínimo
- ✅ Docker Compose configurado
- ✅ CI básico (typecheck/build)

**O que NÃO está implementado (propositalmente):**
- ❌ Login / JWT
- ❌ Forgot-password
- ❌ Endpoints de negócio (HEP, sessões, exercícios)
- ❌ Apps mobile (apenas placeholders)

## Setup local

Veja o [README principal](../../README.md) para instruções de setup.

TLDR:
```bash
./scripts/setup.sh
npm run api:dev
curl localhost:3001/health
```

## Próximos passos

1. **Squad BACKEND (D1–D4):** Implementar autenticação
   - POST /api/v1/auth/login
   - POST /api/v1/auth/forgot-password
   - Middlewares de autenticação

2. **Squad MOBILE:** Implementar apps iOS/Android
   - Conectar com API
   - UI para login/cadastro
   - Fluxos de HEP

3. **Squad PRODUTO:** Definir design tokens e conteúdo pt-BR
