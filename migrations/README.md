Migrations — Baseline Reset
===========================

Files
-----
- `migrations/0001_baseline.sql` — Idempotent baseline for fresh environments.
- `migrations/_archive/**` — Old migrations (do not apply).

Usage
-----
Fresh environment (new Supabase project):
- Apply `0001_baseline.sql` once using your preferred method:
  - Supabase SQL editor: paste file contents and run.
  - `psql`: `psql $DATABASE_URL -f migrations/0001_baseline.sql`.
- This creates tables, RLS policies, triggers, and storage bucket policies.

Existing production (live project):
- Do NOT apply `0001_baseline.sql` — production already matches the baseline.
- Add all future schema changes as new forward-only migrations numbered `0002_*.sql`, `0003_*.sql`, etc.

Conventions
-----------
- Keep migrations small, idempotent where reasonable (e.g., `if not exists`).
- Define RLS policies explicitly in the same migration as the table.
- Avoid destructive changes unless backed by a data migration and manual validation plan.
- Storage: use `public` (public read) and `private` (owner-scoped) buckets; manage policies via SQL.

Archive
-------
The `_archive` folder preserves historical files for context but must never be applied in new or existing environments.

Verification (optional)
-----------------------
After applying baseline on a new environment:
- Confirm buckets exist: `select id, public from storage.buckets;` (expect `public`, `private`).
- Check a couple tables: `select * from pg_policies where schemaname='public';`.
- Ensure triggers are present: profile creation + default favorites.

