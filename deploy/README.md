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
│   ├── 03_api_app_role_auth_tables.sql
│   └── 04_api_app_role_bloco_a_tables.sql
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
- ❌ **NO** `INSERT` — Signup/cadastro em HOLD neste script (ver script 04)
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

```bash
# Local
psql postgresql://origo:origo_dev_password@localhost:5435/origo_dev
\i deploy/sql/03_api_app_role_auth_tables.sql

# Produção
psql <PRODUCTION_DATABASE_URL>
\i deploy/sql/03_api_app_role_auth_tables.sql
```

**Verificação:**

```sql
SELECT table_name, grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('users', 'password_reset_tokens', 'refresh_tokens')
  AND grantee = 'api_app_role'
ORDER BY table_name, privilege_type;
```

**Contexto:**  
Prod login precisa destes grants além de legal+referral (scripts 01/02). Seed de demonstração deve rodar como DB owner, não como `api_app_role`.

---

### `sql/04_api_app_role_bloco_a_tables.sql`

**Propósito:**  
Configura acesso de **privilégio mínimo** para a role `api_app_role` nas tabelas do Bloco A (Professional Profile + Invite Token + Enrollment) e adiciona grant INSERT em `users` para fluxos de cadastro.

**Grants:**

**`users` (novo: INSERT):**
- ✅ `SELECT` / `UPDATE` — Já concedidos em scripts anteriores
- ✅ `INSERT` — **NOVO** para cadastro PROFESSIONAL + STUDENT (Bloco A)
- ❌ **NO** `DELETE` — Remoção de usuários reservada para DBA/compliance

**`professional_profiles` / `invite_tokens` / `enrollments`:**
- ✅ `SELECT` + `INSERT` + `UPDATE`
- ❌ **NO** `DELETE` — purge via role elevada / compliance

**Quando aplicar:**

1. **Após** a migration do Bloco A Slice 1 (`20260914030500_add_bloco_a_slice_1_schema`)
2. **Antes** de a API usar credenciais `api_app_role` nos fluxos de convite/enrollment

**Como aplicar:**

```bash
psql postgresql://origo:origo_dev_password@localhost:5435/origo_dev
\i deploy/sql/04_api_app_role_bloco_a_tables.sql
```

**Verificação:**

```sql
SELECT table_name, grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('professional_profiles', 'invite_tokens', 'enrollments', 'users')
  AND grantee = 'api_app_role'
ORDER BY table_name, privilege_type;
```

**Contexto Bloco A (Slice 1):**  
- Invite tokens hash-only (SHA-256), single-use  
- Enrollments = relacionamento de cuidado (sem dump clínico neste slice)  
- 1 ACTIVE enrollment por `(studentUserId, category)`

---

### `sql/05_api_app_role_hep_tables.sql`

**Propósito:**  
Grants de privilégio mínimo para tabelas do Slice 2–3 HEP (programa, sessões, logs, prontuário).

**Grants:**

**`programs` / `program_exercises` / `workout_sessions` / `session_exercise_logs`:**
- ✅ `SELECT` + `INSERT` + `UPDATE`
- ❌ **NO** `DELETE` — remoção de exercício com log usa soft-remove (`removedAt`)

**`clinical_notes`:**
- ✅ `SELECT` + `INSERT` (append-only)
- ❌ **NO** `UPDATE` / `DELETE`

**Quando aplicar:**

1. **Após** a migration `20260914180000_add_hep_slice_2_3_schema`
2. **Após** scripts 01–04
3. **Antes** de a API usar `api_app_role` nos fluxos HEP

**Como aplicar:**

```bash
psql postgresql://origo:origo_dev_password@localhost:5435/origo_dev
\i deploy/sql/05_api_app_role_hep_tables.sql
```

**Verificação:**

```sql
SELECT table_name, grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN (
    'programs', 'program_exercises', 'workout_sessions',
    'session_exercise_logs', 'clinical_notes'
  )
  AND grantee = 'api_app_role'
ORDER BY table_name, privilege_type;
```

**Ordem de aplicação INFRA (produção):**

1. Migrations Prisma  
2. `01_api_app_role_legal_acceptances.sql`  
3. `02_api_app_role_referral_tables.sql`  
4. `03_api_app_role_auth_tables.sql`  
5. `04_api_app_role_bloco_a_tables.sql`  
6. `05_api_app_role_hep_tables.sql`  
7. (Opcional) seed como DB owner  
8. `DATABASE_URL` da API com `api_app_role`

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
