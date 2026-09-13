# D8 Token Purge Strategy

Documento de referência para limpeza periódica de tokens expirados e usados no sistema Origo.

## Visão Geral

O schema P0 Auth armazena tokens de forma hash-only (SHA-256) em duas tabelas:
- `password_reset_tokens` (single-use, tempo de vida curto)
- `refresh_tokens` (revogáveis, tempo de vida longo)

**IMPORTANTE:** Tokens expirados e usados devem ser removidos do banco via job batch automático para evitar crescimento descontrolado da base.

## Estratégia de Purge

### Password Reset Tokens

**Critério D8:** Remover tokens que estão **expirados OU já foram usados**.

```sql
-- Query recomendada para purge
DELETE FROM password_reset_tokens
WHERE expiresAt < NOW() OR usedAt IS NOT NULL;
```

**Frequência recomendada:** Diário (cron às 03:00 UTC)

**Justificativa:**
- Tokens de reset têm TTL curto (tipicamente 15-60 minutos)
- Uma vez usados (`usedAt IS NOT NULL`), nunca mais serão necessários
- Volume de criação tende a ser baixo, mas acúmulo pode impactar índices

**Indexes otimizados para purge:**
- `password_reset_tokens_expiresAt_idx` — acelera WHERE expiresAt < NOW()
- `password_reset_tokens_userId_idx` — útil para purge por usuário específico

### Refresh Tokens

**Critério D8:** Remover tokens que estão **expirados E revogados**.

```sql
-- Query recomendada para purge
DELETE FROM refresh_tokens
WHERE expiresAt < NOW() AND revokedAt IS NOT NULL;
```

**Frequência recomendada:** Diário (cron às 03:00 UTC)

**Justificativa:**
- Tokens expirados mas não revogados podem ser mantidos temporariamente para auditoria
- Tokens revogados mas não expirados ainda estão tecnicamente válidos (edge case raro)
- Purge conservador: remove apenas quando ambas as condições são verdadeiras

**Indexes otimizados para purge:**
- `refresh_tokens_expiresAt_idx` — acelera WHERE expiresAt < NOW()
- `refresh_tokens_userId_idx` — útil para purge por usuário específico

## Implementação Recomendada

### Opção 1: Cron Job Simples (Node.js)

Criar script `scripts/purge-expired-tokens.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function purgeExpiredTokens() {
  const now = new Date();
  
  // Purge password reset tokens (expired OR used)
  const deletedResets = await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        { usedAt: { not: null } }
      ]
    }
  });
  
  // Purge refresh tokens (expired AND revoked)
  const deletedRefreshTokens = await prisma.refreshToken.deleteMany({
    where: {
      AND: [
        { expiresAt: { lt: now } },
        { revokedAt: { not: null } }
      ]
    }
  });
  
  console.log(`Purged ${deletedResets.count} password reset tokens`);
  console.log(`Purged ${deletedRefreshTokens.count} refresh tokens`);
}

purgeExpiredTokens()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Agendar via crontab:**
```bash
# Executar às 03:00 UTC todos os dias
0 3 * * * cd /path/to/origo && NODE_ENV=production node dist/scripts/purge-expired-tokens.js >> /var/log/origo/token-purge.log 2>&1
```

### Opção 2: SQL Direto via pg_cron (PostgreSQL)

Se o Postgres tiver a extensão `pg_cron` habilitada:

```sql
-- Agendar purge diário às 03:00 UTC
SELECT cron.schedule(
  'purge-expired-tokens',
  '0 3 * * *',
  $$
    DELETE FROM password_reset_tokens WHERE expiresAt < NOW() OR usedAt IS NOT NULL;
    DELETE FROM refresh_tokens WHERE expiresAt < NOW() AND revokedAt IS NOT NULL;
  $$
);
```

## Monitoramento

Métricas recomendadas para acompanhar:
- **Volume de tokens removidos por execução** (alerta se > 10k)
- **Tempo de execução do purge** (alerta se > 30s)
- **Taxa de crescimento das tabelas** (alerta se crescimento linear sem purge)

Logs devem incluir:
```
[TOKEN_PURGE] deleted_password_resets=234 deleted_refresh_tokens=89 duration_ms=145
```

## Segurança

- ✅ **Hash-only storage:** Tokens nunca são armazenados em plaintext
- ✅ **Cascade delete:** Remoção de usuário remove todos seus tokens automaticamente
- ✅ **Índices únicos:** Impossível criar tokens duplicados (tokenHash UNIQUE)
- ⚠️ **Auditoria:** Considerar tabela de auditoria separada se logs de remoção forem críticos para compliance

## Perguntas Frequentes

**Q: Por que não remover refresh tokens expirados imediatamente?**  
A: Manter tokens expirados (mas não revogados) por algumas horas pode ajudar em debugging e auditoria. O impacto de volume é mínimo.

**Q: E se o job de purge falhar?**  
A: Tokens continuarão acumulando, mas o sistema continuará funcionando. A validação de expiresAt é feita na aplicação, não no banco.

**Q: Posso rodar o purge manualmente?**  
A: Sim. Execute o script TypeScript ou as queries SQL diretamente. Recomendado testar em staging primeiro.

**Q: Quantos tokens devem ser purgados por dia?**  
A: Depende do volume de usuários. Para 10k usuários ativos:
- Password resets: ~50-200/dia (assumindo 1-2% de uso diário)
- Refresh tokens: ~1000-5000/dia (assumindo TTL de 7 dias e rotação ativa)

---

**Versão do documento:** 1.0  
**Última atualização:** 2026-09-12  
**Responsável:** Squad BACKEND (D1-D4)
