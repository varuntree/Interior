prd.md
0) Product summary
Interior design generator for Australia. Users upload a room photo (or two), or start from text, then get stunning redesigns in Australian‑relevant styles. We keep the experience simple and guided, with presets and one‑click “wow” flows. Images are generated via Replicate using OpenAI gpt-image-1. MVP ships fast with a thin, reliable backend and a crisp UI.

1) Goals (MVP)
Create photorealistic interiors with 4 guided modes:

Redesign (keep structure, restyle)

Virtual Staging (furnish empty/partly empty rooms)

Compose (merge two inputs: base room + reference/object)

Imagine (text‑only ideation; no input image)

Organize outputs:

Auto‑save every result to My Renders

One‑tap add to default collection My Favorites

Users can create additional Collections (projects)

Inspire:

Community page of admin‑curated collections, each with a “Use these settings” prefill

Australian context:

Preset Room Types and Styles that feel immediately relevant in AU homes

Keep it simple:

No brushes/masks, no custom training

One in‑flight generation per user (clear UX, no confusion)

Plan limits (config‑driven):

Central config defines monthly generation caps per plan; simple gating in UI and API

2) Non‑goals (MVP)
No region selection/brush editing

No fine‑tuning/training

No multi‑tenant team features

No heavy queue/worker infra (we rely on Replicate; see Phase 0 behavior)

3) Primary users & use cases
Homeowners & renters: Fast ideas before buying/renovating; try AU styles (Coastal, Contemporary, Hamptons‑inspired, Scandi‑AU, Mid‑Century‑AU, Minimal, Japandi)

Agents/landlords: Quick virtual staging to improve listings

Design‑curious: Explore styles & palettes; moodboard from Imagine

4) Core flows & acceptance criteria
4.1 Generate (all modes)
Inputs:

Mode: redesign | staging | compose | imagine

Prompt: optional (except imagine where it’s required)

Room Type (dropdown)

Style (dropdown)

Settings: aspect ratio (1:1 | 3:2 | 2:3), quality (auto | low | medium | high), variants (default 2, max 3)

Uploads:

Redesign/Staging: input1 (room)

Compose: input1 (room) + input2 (reference/object)

Imagine: no uploads

Behavior:

If remaining generations = 0 → show upgrade CTA (Stripe checkout)

If user already has 1 in‑flight job → disable Generate + toast “Please wait until this generation is complete.”

On submit:

Show progress state (spinner/“Generating …”)

Create job, call Replicate with webhook URL

On webhook completion, render variants in the UI grid

Acceptance:

Submissions validate per‑mode required inputs

On network retry, idempotency prevents duplicates

“Stuck” protection: jobs that exceed 10 min move to failed with retry CTA

Completed variants are persisted (see 5. Data), thumbs visible in My Renders

4.2 Organize
My Renders:

Auto‑paginates, shows thumb grid, filters by Mode/Room/Style

Collections:

Create, rename, delete (own only)

Default collection My Favorites always present

Add/remove renders to collections

Acceptance:

A render can appear in multiple collections

“Add to My Favorites” is 1‑click and optimistic

4.3 Community
Admin‑curated sets (title, description, hero cover, ordered items)

Each item displays Apply Settings → opens Generate with prefilled room type/style/prompt/settings

Acceptance:

Public read, admin write; no login required to view

Theme v2 tokens applied globally (light + dark)

All core flows are mobile-first and pass responsive smoke checks

5) Data (conceptual, detailed schema in Data & Storage doc)
profiles (already present; Supabase RLS)

generation_jobs: owner, mode, settings, inputs (asset refs), replicate prediction id, status, error

renders & render_variants: link outputs to a job; persist storage paths + metadata

collections & collection_items (with default My Favorites)

community_collections & community_items (admin)

usage_ledger: simple debits for generations; monthly cap check derived

6) Presets & defaults (config‑driven)
Modes order: redesign, staging, compose, imagine

Room Types (AU‑oriented starter set; configurable): Living room, Bedroom, Kitchen, Dining, Bathroom, Home Office, Outdoor/Patio

Styles (starter set; configurable): Coastal AU, Contemporary AU, Japandi, Scandi AU, Minimal AU, Mid‑Century AU, Industrial AU

Aspect ratios: 1:1 (default), 3:2, 2:3

Variants: default 2; UI cap 3

Quality: auto default

Background control: hidden in MVP (off)

7) Plans & limits (simple)
Central config lists plans and monthly generation caps (values TBD)

On submit:

Check remaining generations > 0

If yes: accept, decrement ledger on job accepted (not on completion)

If no: return 402‑style app error with upgrade link

8) Performance & reliability
Route handler “accept time” (submit → job created) ≤ 2s p95

My Renders list (50 thumbs) ≤ 1.5s p95

Webhook processes in ≤ 3s and stores assets

Idempotent submits; exponential backoff on transient 429/5xx from Replicate

9) Compliance & safety
Respect content policy (basic prompt moderation filter end‑to‑end)

No storage of sensitive PII in job metadata

Admin functions restricted to admin role

10) Out‑of‑scope (MVP)
Multi‑image batch in a single call

Collaboration/sharing flows

Fine‑grained per‑element editing

