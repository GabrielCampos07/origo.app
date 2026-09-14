# Origo Deploy

Documentação para deploy e configuração de banco de dados em produção/staging.

---

## 📦 Estrutura

```
deploy/
├── docker-compose.yml          # Docker Compose para desenvolvimento local
├── sql/                        # Scripts SQL para configuração de produção
│   ├── 01_api_app_role_legal_acceptances.sql
│   ├── 02_api_app_role_referral_tables.sql
│   └── 03_api_app_role_auth_tables.sql
└── README.md                   # Este arquivo
```

---

## 🔐 Scripts SQL — Database Security

### `sql/01_api_app_role_legal_acceptances.sql`

**Propósito:**  
Configura acesso de **privilégio mínimo** para a role `api_app_role` na tabela `legal_acceptances` (Legal V2).

**Grants:**
- ✅ `SELECT` — API pode ler registros de aceitação
- ✅ `INSERT` — API pode registrar novas aceitações
- ❌ **NO** `UPDATE` — Tabela é **append-only** (imutável após INSERT)
- ❌ **NO** `DELETE` — Remoções via CASCADE (User delete) ou purge manual DBA

**Quando aplicar:**

1. **Após** a migration do PR #6 ter sido aplicada:  
   ```
   apps/api/prisma/migrations/20260913172057_add_legal_acceptance_model/migration.sql
   ```
   (Confirme que a tabela `legal_acceptances` existe)

2. **Antes** de a API começar a usar credenciais com role `api_app_role`

**Como aplicar:**

#### Desenvolvimento Local (Docker Compose)

```bash
# 1. Conectar ao Postgres local (assumindo docker-compose.yml padrão)
psql postgresql://origo:origo_dev_password@localhost:5435/origo_dev

# 2. Rodar o script
\i deploy/sql/01_api_app_role_legal_acceptances.sql

# 3. Configurar senha da role (se necessário para testes locais)
ALTER ROLE api_app_role PASSWORD 'senha_local_dev';
```

**Nota local:**  
Em dev local, o app normalmente roda como superuser `origo`. Para testar a role restrita:
```bash
# Testar conexão com role restrita
DATABASE_URL="postgresql://api_app_role:senha_local_dev@localhost:5435/origo_dev" npm run api:dev
```

#### Produção (Neon / Fly / outro Postgres gerenciado)

```bash
# 1. Conectar ao DB de produção (ajustar connection string)
psql <PRODUCTION_DATABASE_URL>

# 2. Rodar o script
\i deploy/sql/01_api_app_role_legal_acceptances.sql

# 3. Configurar senha segura para api_app_role
ALTER ROLE api_app_role PASSWORD '<senha-forte-via-secrets-manager>';
```

**Idempotência:**  
O script pode ser executado múltiplas vezes sem erro. Ele verifica se a role já existe antes de criar.

**Verificação:**

```sql
-- Listar grants da role api_app_role na tabela legal_acceptances
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name = 'legal_acceptances'
  AND grantee = 'api_app_role'
ORDER BY privilege_type;

-- Resultado esperado:
-- grantee      | privilege_type
-- -------------|---------------
-- api_app_role | INSERT
-- api_app_role | SELECT
```

**Contexto LGPD (Legal V2):**  
- Registros de aceitação legal são **imutáveis** por requisito de compliance (LGPD Art. 7)
- Apenas INSERT/SELECT permitidos para role da aplicação
- UPDATE/DELETE reservados para DBA ou role de compliance (purge conforme política de retenção)
- Ver PR #6 para mais detalhes: https://github.com/GabrielCampos07/origo.app/pull/6

---

### `sql/02_api_app_role_referral_tables.sql`

**Propósito:**  
Configura acesso de **privilégio mínimo** para a role `api_app_role` nas tabelas do sistema de referral (Referral MVP).

**Grants:**

**`referral_codes`:**
- ✅ `SELECT` — API pode ler códigos para validação
- ✅ `INSERT` — API pode criar novos códigos de referral
- ❌ **NO** `UPDATE` — Códigos são **imutáveis** após criação
- ❌ **NO** `DELETE` — Remoção reservada para DBA/admin

**`referrals`:**
- ✅ `SELECT` — API pode ler status e detalhes de referrals
- ✅ `INSERT` — API pode registrar novas atribuições de referral
- ✅ `UPDATE` — API pode atualizar status (PENDING → ACTIVE → COMPLETED/CANCELLED)
- ❌ **NO** `DELETE` — Registros de referral são permanentes; remoção reservada para DBA

**`referral_payouts`:**
- ✅ `SELECT` — API pode ler histórico de pagamentos
- ✅ `INSERT` — API pode adicionar entradas no ledger de pagamentos
- ❌ **NO** `UPDATE` — Ledger **append-only** (valores/timestamps imutáveis)
- ❌ **NO** `DELETE` — Entradas do ledger são permanentes; remoção reservada para DBA

**Quando aplicar:**

1. **Após** a migration do Referral MVP ter sido aplicada:  
   ```
   apps/api/prisma/migrations/20260913181200_add_referral_mvp_schema/migration.sql
   ```
   (Confirme que as tabelas `referral_codes`, `referrals`, `referral_payouts` existem)

2. **Antes** de a API começar a usar credenciais com role `api_app_role`

**Como aplicar:**

#### Desenvolvimento Local (Docker Compose)

```bash
# 1. Conectar ao Postgres local (assumindo docker-compose.yml padrão)
psql postgresql://origo:origo_dev_password@localhost:5435/origo_dev

# 2. Rodar o script
\i deploy/sql/02_api_app_role_referral_tables.sql

# 3. Configurar senha da role (se necessário para testes locais)
ALTER ROLE api_app_role PASSWORD 'senha_local_dev';
```

**Nota local:**  
Em dev local, o app normalmente roda como superuser `origo`. Para testar a role restrita:
```bash
# Testar conexão com role restrita
DATABASE_URL="postgresql://api_app_role:senha_local_dev@localhost:5435/origo_dev" npm run api:dev
```

#### Produção (Neon / Fly / outro Postgres gerenciado)

```bash
# 1. Conectar ao DB de produção (ajustar connection string)
psql <PRODUCTION_DATABASE_URL>

# 2. Rodar o script
\i deploy/sql/02_api_app_role_referral_tables.sql

# 3. Configurar senha segura para api_app_role (se ainda não configurada)
ALTER ROLE api_app_role PASSWORD '<senha-forte-via-secrets-manager>';
```

**Idempotência:**  
O script pode ser executado múltiplas vezes sem erro. Ele verifica se a role já existe antes de criar.

**Verificação:**

```sql
-- Listar grants da role api_app_role nas tabelas de referral
SELECT 
  table_name,
  grantee, 
  privilege_type 
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name IN ('referral_codes', 'referrals', 'referral_payouts')
  AND grantee = 'api_app_role'
ORDER BY table_name, privilege_type;

-- Resultado esperado:
-- table_name       | grantee      | privilege_type
-- -----------------|--------------|---------------
-- referral_codes   | api_app_role | INSERT
-- referral_codes   | api_app_role | SELECT
-- referral_payouts | api_app_role | INSERT
-- referral_payouts | api_app_role | SELECT
-- referrals        | api_app_role | INSERT
-- referrals        | api_app_role | SELECT
-- referrals        | api_app_role | UPDATE
```

**Integridade de Dados (Database Security Checklist):**

O script adiciona uma constraint CHECK para **prevenir auto-referrals** (`referrerUserId = referredUserId`).  
Esta constraint é aplicada de forma **idempotente** (safe to re-run).

```sql
-- Constraint adicionada pelo script
ALTER TABLE public.referrals
ADD CONSTRAINT referrals_no_self_referral_check
CHECK ("referrerUserId" <> "referredUserId");
```

Query de verificação para DBA/auditoria (deve retornar 0 linhas):

```sql
-- Verificar se existem auto-referrals (constraint deveria prevenir)
SELECT id, "referrerUserId", "referredUserId", "createdAt"
FROM public.referrals
WHERE "referrerUserId" = "referredUserId";
```

**Resultado esperado:** 0 linhas (a constraint previne inserção de auto-referrals)

**Contexto Referral MVP:**  
- Sistema de referral com comissão de 15% para referrer e 1 mês grátis para referred
- `referral_payouts` é append-only ledger para tracking de comissões
- Ver `docs/REFERRAL_MVP.md` para detalhes completos
- Referral schema: commit 4a49c9a (feat(db): referral MVP schema)

---

### `sql/03_api_app_role_auth_tables.sql`

**Propósito:**  
Configura acesso de **privilégio mínimo** para a role `api_app_role` nas tabelas de autenticação (`users`, `password_reset_tokens`, `refresh_tokens`) para suportar login/auth flows em produção.

**Grants:**

**`users`:**
- ✅ `SELECT` — API pode ler perfis de usuários para autenticação/autorização
- ✅ `UPDATE` — API pode atualizar lastLoginAt, password hash, campos de perfil
- ❌ **NO** `INSERT` — Signup/cadastro em HOLD (role elevada requerida)
- ❌ **NO** `DELETE` — Remoção de usuários reservada para DBA/compliance
- ⚠️  **SECURITY NOTE:** UPDATE é table-wide — app/Back Sec **MUST NOT** escalar campo `role` sem RLS adicional

**`password_reset_tokens`:**
- ✅ `SELECT` — API pode validar tokens de reset
- ✅ `INSERT` — API pode criar novas solicitações de reset de senha
- ✅ `UPDATE` — API pode marcar tokens como usados/invalidados
- ❌ **NO** `DELETE` — D8 purge requer role elevada (futura `origo_cron` role)

**`refresh_tokens`:**
- ✅ `SELECT` — API pode validar refresh tokens
- ✅ `INSERT` — API pode criar novos refresh tokens no login
- ✅ `UPDATE` — API pode rotacionar/revogar tokens
- ❌ **NO** `DELETE` — D8 purge requer role elevada (futura `origo_cron` role)

**Quando aplicar:**

1. **Após** as migrations P0 de autenticação terem sido aplicadas ao banco de dados alvo
2. **Após** `01_api_app_role_legal_acceptances.sql` ter sido aplicado
3. **Após** `02_api_app_role_referral_tables.sql` ter sido aplicado
4. **Antes** de a API começar a usar credenciais com role `api_app_role`

**Como aplicar:**

#### Desenvolvimento Local (Docker Compose)

```bash
# 1. Conectar ao Postgres local (assumindo docker-compose.yml padrão)
psql postgresql://origo:origo_dev_password@localhost:5435/origo_dev

# 2. Rodar o script
\i deploy/sql/03_api_app_role_auth_tables.sql

# 3. Configurar senha da role (se necessário para testes locais)
ALTER ROLE api_app_role PASSWORD 'senha_local_dev';
```

**Nota local:**  
Em dev local, o app normalmente roda como superuser `origo`. Para testar a role restrita:
```bash
# Testar conexão com role restrita
DATABASE_URL="postgresql://api_app_role:senha_local_dev@localhost:5435/origo_dev" npm run api:dev
```

#### Produção (Neon / Fly / outro Postgres gerenciado)

```bash
# 1. Conectar ao DB de produção (ajustar connection string)
psql <PRODUCTION_DATABASE_URL>

# 2. Rodar o script
\i deploy/sql/03_api_app_role_auth_tables.sql

# 3. Configurar senha segura para api_app_role (se ainda não configurada)
ALTER ROLE api_app_role PASSWORD '<senha-forte-via-secrets-manager>';
```

**Idempotência:**  
O script pode ser executado múltiplas vezes sem erro. Ele usa `REVOKE ALL` antes de cada `GRANT` para garantir privilégio mínimo explícito.

**Verificação:**

```sql
-- Listar grants da role api_app_role nas tabelas de autenticação
SELECT 
  table_name,
  grantee, 
  privilege_type 
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'password_reset_tokens', 'refresh_tokens')
  AND grantee = 'api_app_role'
ORDER BY table_name, privilege_type;

-- Resultado esperado:
-- table_name              | grantee      | privilege_type
-- ------------------------|--------------|---------------
-- password_reset_tokens   | api_app_role | INSERT
-- password_reset_tokens   | api_app_role | SELECT
-- password_reset_tokens   | api_app_role | UPDATE
-- refresh_tokens          | api_app_role | INSERT
-- refresh_tokens          | api_app_role | SELECT
-- refresh_tokens          | api_app_role | UPDATE
-- users                   | api_app_role | SELECT
-- users                   | api_app_role | UPDATE
```

**Database Security Checklist:**

⚠️  **UPDATE on `users` is table-wide** — A aplicação DEVE enforçar regras de negócio para prevenir escalação não autorizada do campo `role` (ex: student → admin). Considere políticas RLS ou verificações de autorização em nível de aplicação antes de permitir updates no campo `role`.

**Future Work:**
- **DELETE on token tables:** D8 purge requer role elevada (ex: `origo_cron`) com DELETE-only em tokens; manter `api_app_role` sem DELETE. Para implementar, criar role dedicada `origo_cron` e rodar jobs de purge como `origo_cron`.
- **INSERT on users:** Quando signup for retomado, ou conceder INSERT a `api_app_role` ou criar `signup_role` separada com INSERT-only em `users`.

**Contexto de Seed:**  
⚠️  **Seed deve rodar como DB owner/superuser**, NÃO como `api_app_role`:

```bash
# Seed de demonstração (dev local ou staging)
# Cria usuários: prof@origo.dev / OrigoDemoProf1! e aluno@origo.dev / OrigoDemoAluno1!
# Deve usar credenciais de DB owner (ex: origo superuser)
DATABASE_URL="postgresql://origo:origo_dev_password@localhost:5435/origo_dev" npx prisma db seed
```

**Ordem de Aplicação INFRA (Produção):**

Para setup completo de produção, aplicar nesta ordem:

1. Rodar migrations do Prisma (cria/atualiza schema de tabelas)
2. Aplicar `01_api_app_role_legal_acceptances.sql`
3. Aplicar `02_api_app_role_referral_tables.sql`
4. Aplicar `03_api_app_role_auth_tables.sql` ← **ESTE SCRIPT**
5. (Opcional) Rodar seed de demonstração **como DB owner** (não como api_app_role)
6. Configurar `DATABASE_URL` da API para usar credenciais `api_app_role`

**Contexto:**  
Prod login atualmente retorna 500 porque apenas grants de legal+referral existem (scripts 01/02). Este script 03 adiciona os grants necessários para flows de autenticação (login, refresh token, password reset).

---

## 🚫 Fora de Escopo (Não Tocar)

Este diretório **NÃO** gerencia:
- ❌ Provisionamento de cloud databases (Neon/Fly)
- ❌ Configuração de DNS
- ❌ Deployment da aplicação
- ❌ CI/CD pipelines

Para deploy da aplicação, consulte docs de infra/devops separados.

---

## 📚 Referências

- [PR #6 - Legal V2 Schema](https://github.com/GabrielCampos07/origo.app/pull/6)
- [PR #9 - Least-privilege api_app_role for legal_acceptances](https://github.com/GabrielCampos07/origo.app/pull/9)
- [Referral MVP Schema - commit 4a49c9a](https://github.com/GabrielCampos07/origo.app/commit/4a49c9a)
- [Referral MVP Documentation](../docs/REFERRAL_MVP.md)
- [D8 Token Purge](../docs/D8-TOKEN-PURGE.md) — Outro exemplo de compliance/DB security
- [Prisma Schema](../apps/api/prisma/schema.prisma)

---

**Dúvidas?** Consulte a equipe de INFRA ou DATABASE SECURITY CHECKER antes de aplicar em produção.
