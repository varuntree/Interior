Phase 3 — Community (Public + Admin)

Goals

- Public gallery endpoints and UI (search/featured) work end‑to‑end.
- Admin curation flows (ensure, upsert, publish, delete) operational behind allowlist.
- Proper caching for public content; secure admin boundaries.

What’s Implemented

- Public
  - `/api/v1/community` supports featured and search; hydrates image URLs from render cover variants.
  - `/api/v1/community/collections` returns published (featured) collections only.
  - Dashboard Community page loads, searches, applies settings to Create via querystring.
- Admin
  - Allowlist‑based admin check using `ADMIN_EMAILS` env.
  - Collections: upsert (create/update), delete, publish/unpublish (maps to `is_featured`).
  - Items: upsert (external image URL) and delete.
  - Admin page wired to the above routes; basic controls implemented.
- Security
  - Admin checks enforced in admin routes.
  - No service‑role keys used outside webhooks.

Files Touched

- Routes: `/api/v1/community`, `/api/v1/community/collections`, admin community routes (upsert/publish/delete, items upsert/delete), admin ensure.
- Services: `libs/services/community.ts` (admin upsert/delete/publish; published list), `libs/services/admin.ts` (allowlist check).
- Repos: `libs/repositories/community.ts` (deleteCommunityCollection).
- Env: `libs/env/index.ts` added `ADMIN_EMAILS`.
- UI: dashboard community page; admin community page behaviors rely on updated endpoints.

Verification Checklist

- Search: returns items; Apply Settings navigates to Create with prefilled params.
- Featured toggle: publish/unpublish updates gallery visibility.
- Create/update/delete collections: applied and reflected on admin and public endpoints.
- Add/remove items: visible in gallery; deletions applied.
- Public responses include caching headers; admin routes require authenticated allowlisted user.

Notes

- Cover images hydrate from render cover variant; external items use provided URL.
- Payments/plan enforcement deferred to final phase per updated plan.

