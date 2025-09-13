# Overview & UX — Interior Design Generator (Core)

Purpose
- Give a new contributor a crisp understanding of what the app does, how users flow through it, and what “good” looks like in the UI. Read this before touching code. This is not a code dump; it explains the product and UX contracts that the code must satisfy.

Product Summary
- An Australian‑oriented interior design generator. Users upload a room photo (or start from text) and receive photoreal redesigns. Four guided modes keep things simple: Redesign, Virtual Staging, Compose (two inputs), and Imagine (text‑only). Results are saved automatically to “My Renders” and can be organized into Collections, with a default “My Favorites.” Admin‑curated Community sets inspire and can prefill generation inputs.

MVP Scope (and Non‑Goals)
- In scope: the four modes above; AU‑relevant presets (Room Types, Styles); simple controls (mode, presets, prompt); one in‑flight generation per user; plan‑based monthly caps; webhook‑based async processing; public image delivery via Supabase Storage.
- Out of scope (for MVP): brush/mask editing; fine‑tuning; batch jobs; collaboration/teams; heavy custom infra (we rely on Replicate + webhooks); complex admin UI (basic admin actions exist via APIs/SQL).

Primary Users & Use Cases
- Homeowners/renters exploring AU styles before buying/renovating; agents/landlords staging listings; design‑curious users creating moodboards. Success means fast, believable visuals with minimal setup and clear presets.

End‑to‑End Flow (Happy Path)
- User signs in → navigates to Create → selects a mode and presets (Room Type, Style), provides inputs (images or prompt), clicks Generate. API checks credits and enforces the “one in‑flight job” rule → uploads inputs (if any) → calls Replicate (Google nano‑banana) with a webhook back to our app. UI shows progress (polls job status). Webhook completes → image stored to public bucket and linked to a Render → UI shows result → user can Save to “My Favorites” or a Collection, and Download.

Navigation Map (Dashboard)
- Overview: recent renders and quick actions.
- Create (primary): generation workspace for the four modes.
- My Renders: all render groups (each groups 1–3 variants) with filters.
- Collections: user collections, including a system “My Favorites.”
- Community: admin‑curated inspiration sets with “Apply Settings.”
- Settings: basic profile + manage billing links.

Key Screens (Goals and States)
- Create (/dashboard/create)
  - Goal: make “Generate” obvious. Presets guide novices; advanced controls are minimal. Required inputs depend on mode.
  - States: Idle (ready); Submitting (locks form, shows toast/progress); Processing (periodic GET /api/v1/generations/:id); Succeeded (show variants grid with actions); Failed (clear message + Try Again prefilled).
- My Renders (/dashboard/renders)
  - Goal: help users find results fast. Grid of render groups with filters for Mode/Room/Style. Clicking opens details with larger images and actions.
  - States: Empty (route to Create); Paged loading for larger libraries.
- Collections (/dashboard/collections)
  - Goal: lightweight organization. “My Favorites” always present; create/rename/delete other collections. Add/remove renders from collections.
  - States: list of collections; inside a collection, a grid of items with remove/open actions.
- Community (/dashboard/community)
  - Goal: inspire and accelerate. Curated sets with items tied to an internal render or an external image. “Apply Settings” opens Create with prefilled mode/presets/prompt.
- Settings (/dashboard/settings)
  - Goal: show plan and provide manage billing link. Email is read‑only. Minimal edits.

Design Principles (Pragmatic)
- Simple first: one clear action per screen; no vertical silos. Prefer reusing existing components and services over new ones.
- Guardrails: one in‑flight generation per user; plan caps enforced; idempotent submits; clear error states. Keep business logic in services; UI remains thin.
- Minimal dependencies: avoid new libraries unless a quick checklist shows a meaningful win (performance or UX) and zero conflicts with existing stack.
- Accessibility and performance: readable defaults, proper alt text, lazy‑load images, responsive layout, no layout shift on important actions.

Modes & Inputs (At a Glance)
- Redesign: restyle a room without changing structure. Requires image input (room). Optional prompt.
- Staging: furnish empty/under‑furnished rooms. Requires image input (room). Optional prompt.
- Compose: apply a reference style/object to a base room. Requires two images (base room + reference). Optional prompt.
- Imagine: concept from text‑only. Requires prompt; no image uploads.

Presets & Settings (Source of Truth)
- Presets and defaults come from `libs/app-config/runtime.ts` (Room Types, Styles). The UI should render the lists from this config and enforce limits (e.g., accepted mime types, max upload size). Keep the config file the single source of truth; do not hardcode copies in components.

Essential UX Rules (Enforced by UI and API)
- Disable Generate while a job is in‑flight; surface a friendly toast if a user tries to submit again.
- If credits are exhausted, disable submission and show a clear upgrade CTA.
- Show progress with simple steps; refresh results on webhook completion or polling update.
- Saving to Favorites is one‑click and optimistic; Collections operations are fast, with clear feedback.

External Services (Mental Model)
- Supabase: auth, Postgres (with RLS), and Storage. Storage uses private bucket for inputs and public for outputs.
- Replicate: google/nano‑banana; we send composed prompts and (signed) input image URLs; results arrive via webhook and are stored as JPGs in public storage.
- Stripe: subscriptions and portal; plan caps are mapped from Stripe priceIds into runtime config for monthly generation limits.

Outcomes
- When following this document, contributors can navigate the app, understand where to add or modify UX flows, and maintain consistency with the product intent. For data shapes, schemas, adapter mapping, or endpoint details, consult the Architecture, Data & Storage, Engine, and API docs in this core set.
- Note: advanced generation settings (aspect ratio, quality, variants) are not used by the current provider and are hidden in the MVP UI.
