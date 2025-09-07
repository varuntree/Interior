# Storage & Paths

## Buckets
- `public`: public read, authenticated write
- `private`: owner-scoped via RLS

## Path Conventions
- Inputs (uploads): `private/<userId>/inputs/<uuid>.<ext>`
- Outputs: `public/renders/<renderId>/<idx>.webp`
- Thumbs: `public/renders/<renderId>/<idx>_thumb.webp` (optional)

## Access Rules
- Use storage helpers for upload and signed URLs
- No service-role keys outside webhooks
- Persist outputs to our own storage; do not depend on external URLs long-term

## Checklist
- [ ] All services use helpers (no raw client scattered)
- [ ] Paths follow conventions
- [ ] Public images load via CDN with cacheable headers
