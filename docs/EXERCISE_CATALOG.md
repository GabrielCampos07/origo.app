# Exercise video catalog

Origo ships a curated `exercise_catalog_items` table so professionals can attach demo videos to HEP lines.

## Placeholder video URLs

Seed / demo catalog items use **public sample MP4s** from Google’s GTV sample bucket, rotated across exercises:

- Base: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/`
- Examples: `BigBuckBunny.mp4`, `ElephantsDream.mp4`, `ForBiggerBlazes.mp4`, `Sintel.mp4`, `TearsOfSteel.mp4`, …

These are **not clinical content** — they exist so the student UI can exercise the `<video>` player and the pro catalog picker end-to-end. Replace `videoUrl` / `thumbnailUrl` with real exercise media before production.

## API

- `GET /api/v1/exercises/catalog?q=&tag=` — PROFESSIONAL, payment + legal gated; active items only; limit 50.
- Program create/PUT accept optional `catalogItemId` on each exercise; name defaults from catalog when omitted.
- Student program/session payloads include resolved `videoUrl`, `thumbnailUrl`, and `cuesPt` when a catalog link exists.

## DB grants

`api_app_role` gets **SELECT** only on `exercise_catalog_items` (see `deploy/sql/06_api_app_role_exercise_catalog.sql`). Catalog writes are via seed/owner. `program_exercises.catalogItemId` is still updated under existing HEP grants.
