0) Purpose
Single source of truth for the product’s navigation, screens, flows, components, and states. It stays strictly within our MVP scope (InteriorAI/RoomGPT‑class features), aligned to our repo rules (App Router, shadcn/ui, Tailwind tokens, no Server Actions, API→Service→Repo).

1) Design principles
Simple first: one clear primary action per screen.

Hand‑holding UX: presets + guardrails; users don’t need to be prompt experts.

Non‑technical users: obvious defaults, progressive disclosure of options.

Fast feedback: visible loading state, “one in‑flight job” per user, immediate result display.

Coherent visuals: use design tokens already in app/globals.css (TweakCN‑friendly), shadcn/ui components.

2) Information architecture (routes & nav)
Left sidebar (persistent) → right content area.

bash
Copy
/dashboard                       → Overview (recent renders + quick actions)
/dashboard/create                → Generation workspace (primary screen)
/dashboard/renders               → My Renders (all results)
/dashboard/collections           → Collections (incl. “My Favorites”)
/dashboard/community             → Community (admin‑curated inspiration)
/dashboard/settings              → Profile & subscription (basic)
Notes

All under (app)/dashboard/* (we already have auth guard in app/(app)/dashboard/layout.tsx).

Marketing pages remain in (marketing) and are out of scope here.

Community is read‑only for users; content curated by admin via separate admin UI later.

3) Sidebar & layout
3.1 Sidebar items (top → bottom)
Overview

Create (primary CTAs)

My Renders

Collections

Community

(Divider)

Settings

Show current plan/usage micro‑badge at the bottom (optional MVP: static text or “—” until endpoint exists).

3.2 Header (page right)
Page title, optional subtitle.

Secondary actions contextually (e.g., “New Collection” on Collections).

4) Generation workspace (/dashboard/create) — core screen
4.1 Goals
Make “Generate” obvious.

Presets guide the user (Room Type, Style, Mode).

Provide just‑enough controls: Aspect Ratio, Quality, Variants.

Support the 4 modes: Redesign, Staging, Compose, Imagine.

4.2 Layout (top → bottom)
Mode selector (segmented buttons): Redesign | Staging | Compose | Imagine

Tooltip short descriptions.

Inputs area (content varies by mode):

Redesign / Staging:

Dropzone Input Image (required). Accepts JPG/PNG/WebP.

Inline thumbnail preview with “Replace” button.

Compose:

Dropzone Base Room (required).

Dropzone Reference / Object (required).

Small helper text: “We’ll keep the base room architecture; we only transfer style/objects from reference.”

Imagine:

No image inputs.

Presets (two dropdowns with searchable list):

Room Type (AU‑oriented list, configurable).

Style (AU‑oriented list, configurable).

Prompt

Textarea “What do you have in mind?” (optional for Redesign/Staging/Compose; required for Imagine).

Helper: short examples, e.g., “light oak floors, linen sofa, coastal palette”.

Settings (disclosed accordion):

Aspect Ratio: 1:1, 3:2, 2:3 (radio).

Quality: Auto (default), Low, Medium, High.

Variants: 1–3 (default 2).

Generate button (primary)

Disabled if: missing required inputs, no credits, or a job is already in‑flight.

4.3 States
Idle: Generate enabled (if inputs valid).

Submitting: Button becomes loading; form disabled; toast “Submitting…”.

Processing: Inline status panel appears:

Step 1: “Uploading” (if images) → Step 2: “Creating prediction” → Step 3: “Rendering…”.

Show fun progress skeletons; polling GET /api/v1/generations/:id every 2–3s.

Succeeded:

Show Result panel: grid 1–3 variants (Card with image + actions).

Failed:

Inline error card with message + buttons: Try Again (pre‑filled) / Edit inputs.

4.4 Result card (each variant)
Large image (click to open viewer).

Actions bar:

Save: “Add to My Favorites” (one‑click), or “Add to Collection…” (modal list + “Create collection”).

Download (direct public URL).

Copy prompt (tooltip).

Re‑run (pre‑fills same settings, reopens workspace; still respects one in‑flight rule).

4.5 Edge cases
If user clicks Generate while in‑flight → toast: “Please wait until this generation is complete.”

If no credits → disabled button + inline hint with Upgrade CTA (link to checkout).

If Replicate returns fewer outputs than requested → show what we have; info tooltip “2/3 variants returned”.

5) My Renders (/dashboard/renders)
Filters: by Mode, Room Type, Style; search by free text (client‑side filter on loaded page or server pagination later).

Grid of render “groups” (cover shows variant 0).

Clicking a card opens Render details: larger images, variants selector, actions (Save/Download).

Empty state: friendly illustration + “Go to Create”.

Pagination: simple “Load more” button MVP.

6) Collections (/dashboard/collections)
List of user collections (tiles), first pinned: My Favorites (system, non‑deletable).

Actions:

New Collection (modal name field).

Rename (inline, except for Favorites).

Delete (confirm, except for Favorites).

Opening a collection → grid of items (renders).

Item kebab: Remove from collection, Open render.

7) Community (/dashboard/community)
Curated sections (from community_collections), each a horizontal carousel or masonry grid.

Items can link to:

An internal render (opens details) or

External image (opens viewer).

Try this look button on each item → jumps to Create pre‑filled (applies apply_settings from community item).

8) Settings (/dashboard/settings) — minimal
Profile (email readonly from Supabase).

Plan (name, price) with button Manage billing (Stripe portal route).

Support mailto or Crisp (if configured in config.ts).

9) Component inventory (re‑use shadcn/ui)
Buttons (components/ui/button.tsx) — use variants: default, secondary, outline, ghost.

Dropdown/menus (already present).

Cards (components/ui/card.tsx) — result cards, collection tiles.

Input / Label — for prompt, names.

Modals (can be built with Dialog from shadcn if added; MVP can use simple full‑screen sheet if Dialog not installed).

Dropzone: simple styled <input type=file> + drag overlay; no need for a heavy library MVP.

Tokens in app/globals.css drive colors, radii, shadows; keep default.

10) Accessibility & keyboard
Every actionable icon has discernible text (aria‑label).

Images use alt like “Living room – Coastal AU – variant 1”.

Focus outlines visible, no focus traps; Escape closes modals.

Keyboard: Enter submits Generate, ⌘/Ctrl+K (optional) can focus prompt.

11) Copy guidelines
Short, friendly, action‑oriented.

Examples:

Loading: “Working on your design…”

In‑flight re‑submit blocked: “Please wait until this generation is complete.”

Validation: “Please add a room photo to continue.”

12) Performance & media
Render images: public bucket URLs; display max width container w/ responsive sizes.

Prefer .webp outputs; lazy‑load offscreen images.

No client‑side image editing tools in MVP.

13) Minimal analytics (optional later)
Events (string constants): gen_submit, gen_success, gen_fail, save_favorite, add_to_collection.

14) Acceptance checklist (UI)
✅ Generate page supports 4 modes with required inputs.

✅ One in‑flight job guard enforced in UI.

✅ Result variants view + Save/Download actions.

✅ Collections include auto “My Favorites”; add/remove flows work.

✅ Community opens and can pre‑fill Create.

✅ All pages render behind /dashboard guard; unauthenticated users redirected to /signin.

