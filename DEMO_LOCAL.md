# Origo — local demo snapshot

Pushed from Gabriel Mac demo stack (2026-09-12).

- Auth tip ancestry: `cursor/auth-p0-api-on-db-schema` + front `cursor/auth-frontend-084b`
- Hotpatch: reset email link `/reset-password#token=` (D3 amend); `FRONTEND_URL` default `:3456`
- Ports: API `:3001` · Postgres `:5435` · Mailhog `:8025` · Web `:3456`

```bash
cp .env.example .env   # set JWT_SECRET
./scripts/setup.sh     # or docker compose + migrate
npm run api:dev
npm run web:dev
```

Seed (after `npx prisma db seed` in apps/api):
- prof@origo.dev / OrigoDemoProf1!
- aluno@origo.dev / OrigoDemoAluno1!
