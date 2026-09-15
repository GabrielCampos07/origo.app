# Origo — local demo snapshot

Pushed from Gabriel Mac demo stack (2026-09-12).

- Auth tip ancestry: `cursor/auth-p0-api-on-db-schema` + front `cursor/auth-frontend-084b`
- Hotpatch: reset email link `/reset-password#token=` (D3 amend); `FRONTEND_URL` default `:3456`
- Ports: API `:3001` · Postgres `:5437` · Mailhog `:8025` · Web `:3456`

```bash
cp .env.example .env   # set JWT_SECRET
./scripts/setup.sh     # or docker compose + migrate
npm run api:dev
npm run web:dev
```

Seed demo emails (after `npx prisma db seed` in apps/api):
- `prof@origo.dev` — Fisioterapeuta
- `aluno@origo.dev` — Paciente (fisio)
- `educador@origo.dev` — Educação Física
- `aluno.educador@origo.dev` — Aluno (educador)

Passwords live only in `apps/api/prisma/seed.ts` (hashed at seed time). For localhost quick-login buttons:

```bash
cp apps/web/.env.local.example apps/web/.env.local
# fill NEXT_PUBLIC_DEMO_* with the same plaintext passwords used in seed.ts
```
