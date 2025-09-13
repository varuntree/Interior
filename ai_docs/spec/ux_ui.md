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

Provide just‑enough controls: Mode, Presets (Room Type, Style), and Prompt.

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

Settings: none required for the new model (keep UI minimal).

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

If upstream returns multiple outputs, show all available; when fewer outputs are returned than expected, show what we have and optionally display an info tooltip.

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
Curated sections (from community_images), each a horizontal carousel or masonry grid.

Items can link to:

An internal render (opens details) or

External image (opens viewer).

Try this look button on each item → jumps to Create pre‑filled (applies apply_settings from community item).

8) Settings (/dashboard/settings) — minimal
Profile (email readonly from Supabase).

Plan (name, price) with button Manage billing (Stripe portal route).

Support contact via mailto (or an external tool if configured separately).

9) Component inventory (re‑use shadcn/ui)
Buttons (components/ui/button.tsx) — use variants: default, secondary, outline, ghost.

Dropdown/menus (already present).

Cards (components/ui/card.tsx) — result cards, collection tiles.

Input / Label — for prompt, names.

Modals (can be built with Dialog from shadcn if added; MVP can use simple full‑screen sheet if Dialog not installed).

Dropzone: simple styled <input type=file> + drag overlay; no need for a heavy library MVP.

**Theme Integration Notes:**
- All components inherit border radius from `--radius: 1.3rem` for a modern, rounded aesthetic
- Elevation is minimal with essentially flat shadows (0.00 opacity) for a clean, modern look
- Charts utilize dedicated `--chart-*` color variables for consistent data visualization
- Typography uses Open Sans for improved readability across all components
- Tokens in app/globals.css drive all visual properties

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

Prefer .jpg outputs; lazy‑load offscreen images.

No client‑side image editing tools in MVP.

13) Minimal analytics (optional later)
Events (string constants): gen_submit, gen_success, gen_fail, save_favorite, add_to_collection.

14) Acceptance checklist (UI)
✅ Generate page supports 4 modes with required inputs.

✅ One in‑flight job guard enforced in UI.

✅ Result variants view + Save/Download actions.

✅ Collections include auto "My Favorites"; add/remove flows work.

✅ Community opens and can pre‑fill Create.

✅ All pages render behind /dashboard guard; unauthenticated users redirected to /signin.

15) Theme v2 — Design Tokens

The application uses a comprehensive design token system defined in app/globals.css with full light and dark mode support.

**Light Mode (:root)**
```css
:root {
  --background: 0 0% 100%;
  --foreground: 210 25% 7.8431%;
  --card: 180 6.6667% 97.0588%;
  --card-foreground: 210 25% 7.8431%;
  --popover: 0 0% 100%;
  --popover-foreground: 210 25% 7.8431%;
  --primary: 203.8863 88.2845% 53.1373%;
  --primary-foreground: 0 0% 100%;
  --secondary: 210 25% 7.8431%;
  --secondary-foreground: 0 0% 100%;
  --muted: 240 1.9608% 90%;
  --muted-foreground: 210 25% 7.8431%;
  --accent: 211.5789 51.3514% 92.7451%;
  --accent-foreground: 203.8863 88.2845% 53.1373%;
  --destructive: 356.3033 90.5579% 54.3137%;
  --destructive-foreground: 0 0% 100%;
  --border: 201.4286 30.4348% 90.9804%;
  --input: 200 23.0769% 97.4510%;
  --ring: 202.8169 89.1213% 53.1373%;
  
  /* Charts */
  --chart-1: 203.8863 88.2845% 53.1373%;
  --chart-2: 159.7826 100% 36.0784%;
  --chart-3: 42.0290 92.8251% 56.2745%;
  --chart-4: 147.1429 78.5047% 41.9608%;
  --chart-5: 341.4894 75.2000% 50.9804%;
  
  /* Sidebar */
  --sidebar: 180 6.6667% 97.0588%;
  --sidebar-foreground: 210 25% 7.8431%;
  --sidebar-primary: 203.8863 88.2845% 53.1373%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 211.5789 51.3514% 92.7451%;
  --sidebar-accent-foreground: 203.8863 88.2845% 53.1373%;
  --sidebar-border: 205.0000 25.0000% 90.5882%;
  --sidebar-ring: 202.8169 89.1213% 53.1373%;
  
  /* Typography */
  --font-sans: Open Sans, sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: Menlo, monospace;
  
  /* Layout */
  --radius: 1.3rem;
  
  /* Shadows (minimal/flat design) */
  --shadow-2xs: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0.00);
  --shadow-xs: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0.00);
  --shadow-sm: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0.00), 0px 1px 2px -1px hsl(202.8169 89.1213% 53.1373% / 0.00);
  --shadow: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0.00), 0px 1px 2px -1px hsl(202.8169 89.1213% 53.1373% / 0.00);
  --shadow-md: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0.00), 0px 2px 4px -1px hsl(202.8169 89.1213% 53.1373% / 0.00);
  --shadow-lg: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0.00), 0px 4px 6px -1px hsl(202.8169 89.1213% 53.1373% / 0.00);
  --shadow-xl: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0.00), 0px 8px 10px -1px hsl(202.8169 89.1213% 53.1373% / 0.00);
  --shadow-2xl: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0.00);
  
  /* Spacing */
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}
```

**Dark Mode (.dark)**
```css
.dark {
  --background: 0 0% 0%;
  --foreground: 200 6.6667% 91.1765%;
  --card: 228 9.8039% 10%;
  --card-foreground: 0 0% 85.0980%;
  --popover: 0 0% 0%;
  --popover-foreground: 200 6.6667% 91.1765%;
  --primary: 203.7736 87.6033% 52.5490%;
  --primary-foreground: 0 0% 100%;
  --secondary: 195.0000 15.3846% 94.9020%;
  --secondary-foreground: 210 25% 7.8431%;
  --muted: 0 0% 9.4118%;
  --muted-foreground: 210 3.3898% 46.2745%;
  --accent: 205.7143 70% 7.8431%;
  --accent-foreground: 203.7736 87.6033% 52.5490%;
  --destructive: 356.3033 90.5579% 54.3137%;
  --destructive-foreground: 0 0% 100%;
  --border: 210 5.2632% 14.9020%;
  --input: 207.6923 27.6596% 18.4314%;
  --ring: 202.8169 89.1213% 53.1373%;
  
  /* Dark mode charts (same as light for consistency) */
  --chart-1: 203.8863 88.2845% 53.1373%;
  --chart-2: 159.7826 100% 36.0784%;
  --chart-3: 42.0290 92.8251% 56.2745%;
  --chart-4: 147.1429 78.5047% 41.9608%;
  --chart-5: 341.4894 75.2000% 50.9804%;
  
  /* Dark mode sidebar */
  --sidebar: 228 9.8039% 10%;
  --sidebar-foreground: 0 0% 85.0980%;
  --sidebar-primary: 202.8169 89.1213% 53.1373%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 205.7143 70% 7.8431%;
  --sidebar-accent-foreground: 203.7736 87.6033% 52.5490%;
  --sidebar-border: 205.7143 15.7895% 26.0784%;
  --sidebar-ring: 202.8169 89.1213% 53.1373%;
  
  /* Typography (same as light) */
  --font-sans: Open Sans, sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: Menlo, monospace;
  
  /* Layout (same as light) */
  --radius: 1.3rem;
  
  /* Dark mode shadows (minimal/flat) */
  --shadow-2xs: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0.00);
  --shadow-xs: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0.00);
  --shadow-sm: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0.00), 0px 1px 2px -1px hsl(202.8169 89.1213% 53.1373% / 0.00);
  --shadow: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0.00), 0px 1px 2px -1px hsl(202.8169 89.1213% 53.1373% / 0.00);
  --shadow-md: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0.00), 0px 2px 4px -1px hsl(202.8169 89.1213% 53.1373% / 0.00);
  --shadow-lg: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0.00), 0px 4px 6px -1px hsl(202.8169 89.1213% 53.1373% / 0.00);
  --shadow-xl: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0.00), 0px 8px 10px -1px hsl(202.8169 89.1213% 53.1373% / 0.00);
  --shadow-2xl: 0px 2px 0px 0px hsl(202.8169 89.1213% 53.1373% / 0.00);
}
```

16) Responsive System (Mobile-first)

**Breakpoints**
- Mobile baseline: 375px (iPhone SE/8)
- Mobile large: 414px (iPhone Plus/Pro Max)  
- Tablet: 768px (iPad portrait)
- Desktop: 1280px (laptop/desktop)

**Layout Rules for Key Screens**

**Generator Page (/dashboard/create)**
- Mobile (<768px):
  - Single column layout
  - Sticky bottom primary action (Generate button)
  - Mode selector as horizontal scroll or dropdown
  - Collapsed settings accordion by default
  - Full-width dropzones
  
- Tablet (768px-1279px):
  - Two column layout (inputs left, preview right)
  - Settings expanded inline
  - Mode selector as segmented control
  
- Desktop (≥1280px):
  - Three column layout (sidebar nav, inputs, preview)
  - All controls visible
  - Hover states enabled

**My Renders Grid**
- Mobile: 1 column
- Tablet: 2 columns  
- Desktop: 3-4 columns

**Tap Target Sizes**
- Minimum touch target: 44×44px
- Button heights: min 44px on mobile
- Form inputs: min 44px height on mobile
- Spacing between tappable elements: min 8px

**Line Lengths & Typography**
- Max line length: 65-75 characters (prose)
- Font sizes scale with viewport
- Mobile base: 16px (prevents zoom on iOS)

**Spacing Ramp**
- Mobile: 4px base unit (--spacing: 0.25rem)
- Tablet/Desktop: can use larger spacing multipliers
- Consistent padding: 16px on mobile, 24px on tablet+
