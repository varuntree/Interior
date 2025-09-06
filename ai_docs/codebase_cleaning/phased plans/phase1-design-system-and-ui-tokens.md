# Phase 1 — Design System & UI Tokens (Detailed Plan)

Objective: Eliminate hardcoded styles and enforce token-based design across components without changing business logic or behavior. Ensure light/dark parity and mobile-first responsiveness.

Scope (what we touch)
- Components in `components/**/*` and any style usage in `app/(app)/**` and `app/(marketing)/**` where applicable.
- Tailwind utility classes and inline className strings.
- Minor JSX structure tweaks only when needed for accessibility or layout consistency (no logic changes).

Out of scope (do not change)
- API logic, services, repositories, database, or storage code.
- Routes and data flow.
- Copy text and UX flows.

Safety & workflow
- Small, incremental PRs per component group (e.g., generation/, dashboard/, community/).
- Keep diffs minimal and visual (styles-only). No renames/moves.
- Validate each PR with visual checks and scripts.

1) Pre-checks (must pass before starting changes)
- npm run typecheck
- npm run lint
- npm run build
- npm run verify:grep

2) Token source of truth verification
- Confirm tokens exist in `app/globals.css` and Tailwind maps them (tailwind.config.js):
  - Colors: `--background`, `--foreground`, `--primary`, `--muted`, `--accent`, `--border`, `--input`, `--ring`, etc.
  - Sidebar tokens: `--sidebar*`.
  - Chart tokens: `--chart-1..5`.
  - Radius: `--radius` mapped to rounded sizes.
  - Typography: `--font-sans`, `--font-serif`, `--font-mono`.
  - Shadows: flat tokens (0.00 opacity) for minimal aesthetic.
- If a token is missing for a legitimate need, propose adding it (separate small PR updating globals.css and tailwind config), otherwise do not hardcode.

3) Audit: find hardcoded styles
- Colors (bg/text/border):
  - rg -n "bg-\[(#|rgb|hsl)" components
  - rg -n "text-\[(#|rgb|hsl)" components
  - rg -n "border-\[(#|rgb|hsl)" components
  - rg -n "className=\\\".*(#[0-9a-fA-F]{3,6}).*\\\"" components
- Radius & shadows:
  - rg -n "rounded-\[(.+)\]" components
  - rg -n "shadow-\[(.+)\]" components
- Fonts and spacing overrides:
  - rg -n "font-\[(.+)\]" components
  - rg -n "(px|pt|rem)" components | rg -n "style=|className=.*\[(.+)\]"
- Inline style objects (rare):
  - rg -n "style=\{" components

4) Replacement rules (canonical mappings)
- Colors:
  - Backgrounds: replace with `bg-background|bg-card|bg-popover|bg-primary|bg-accent|bg-muted|bg-sidebar` as appropriate.
  - Text: `text-foreground|text-card-foreground|text-primary-foreground|text-accent-foreground|text-muted-foreground|text-sidebar-foreground`.
  - Borders/Inputs: `border-border|border-input`.
  - Rings: `ring-ring` (with focus utilities via Tailwind).
- Radius:
  - Use `rounded-lg` (maps to `--radius`), `rounded-md`, `rounded-sm`.
  - Remove ad hoc pixel-based radii.
- Shadows:
  - Use `shadow-sm|shadow|shadow-md|shadow-lg` (these are flat per tokens).
  - Remove custom shadow values.
- Typography:
  - Use `font-sans|font-serif|font-mono`; no hardcoded font-family.
- Spacing:
  - Use Tailwind spacing scale; avoid arbitrary pixel literals unless necessary for layout. Prefer utilities (`p-`, `m-`, `gap-`).

5) Component-by-component pass (order and checks)
- Generation workspace (`components/generation/*`):
  - ModeSelector, PromptInput, ImageUpload, GenerationSettings, GenerationProgress, ResultsGrid, ResultCard.
  - Ensure sticky CTA on mobile (Generate button) and tap targets ≥44px.
  - Verify image cards use tokenized backgrounds/borders and radius.
- Dashboard (`components/dashboard/*`):
  - Normalize cards, headers, sidebar alignments with tokens.
- Collections & Community (`components/community/*`, `components/settings/*`, `components/common/*`):
  - Tokenize badges, cards, list items.
- UI primitives (`components/ui/*`):
  - Ensure shadcn components use token classes already; extend only if safe and needed.

6) Accessibility & theme parity
- Ensure visible focus states: use `focus:ring-2 ring-ring` and `focus:outline-none` where appropriate.
- Check WCAG contrast for primary/foreground and destructive states in both themes.
- Verify light/dark tokens render readable UI; avoid hardcoded dark/light only styles.

7) Responsive and mobile-first checks
- Generator page:
  - Mobile: single column; sticky bottom CTA; inputs full-width; settings collapsed by default.
  - Tablet: two columns; settings visible inline.
  - Desktop: three columns; all controls visible.
- Grids:
  - My Renders: 1/2/3+ columns based on breakpoints.
- Tap targets and spacing: adhere to minimum sizes; no horizontal scroll.

8) Performance hygiene (UI-only)
- Use `loading=\"lazy\"` on non-critical images.
- Avoid heavy inline SVG filters or CSS that trigger layout thrashing.
- Memoize expensive subtrees only if re-render hotspots are obvious; otherwise defer to Phase 7.

9) Exceptions policy
- Only allow inline style or arbitrary values when:
  - Mapping a precise layout quirk that tokens/utilities cannot express without bloat.
  - Temporary migration gap to be cleaned in the next PR.
- Document each exception inline (short comment) and in the PR description.

10) PR template (for each component group)
- Summary: Tokenization changes only; no behavioral changes.
- Files touched: list.
- Manual checks:
  - Light/dark parity on modified components (screenshots optional).
  - Mobile/tablet/desktop quick view.
  - Focus states visible; no new overflow.
- Scripts: `npm run typecheck && npm run lint && npm run build && npm run verify:grep`.
- Risk/rollback: Style-only changes, safe to revert file-by-file.

11) Validation checklist (must pass before merge)
- No hardcoded colors/radius/shadow remain in edited files.
- Visual diff acceptable; no layout regressions.
- Accessibility focus outlines present.
- Theme toggle tested on generator, renders, collections.
- Viewports: 375×812, 414×896, 768×1024, 1280×800.

12) Deliverables
- 2–4 small PRs covering: generation, dashboard, collections/community(+settings), common/UI touch-ups.
- Update `ai_docs/codebase_cleaning/CHANGELOG.md` with a short summary per PR.

13) Exit criteria (Phase 1 complete)
- All audited hardcoded styles removed or justified as exceptions.
- Light/dark parity verified in core screens.
- Mobile-first elements confirmed (sticky CTA + touch sizes) on generator.
- All scripts pass; no forbidden patterns introduced.

Appendix A — Quick class mapping examples
- bg-[#fff] → bg-background
- text-[#000] → text-foreground
- border-[#e5e7eb] → border-border
- rounded-[12px] → rounded-lg or rounded-md
- shadow-[0_1px_2px_rgba(...)] → shadow-sm

Appendix B — Useful ripgrep combos
- rg -n "(bg|text|border|shadow|rounded)-\[(.+)\]" components
- rg -n "style=\{" components | rg -n -v "eslint-disable|ts-ignore"

Verification Summary (Completed)
- Pre-checks passed: typecheck, lint (warnings only), build.
- Hardcoded colors replaced in generation components, community overlay buttons, and settings usage.
- Mobile sticky CTA added to generator; desktop/tablet button unchanged.
- Exceptions documented: shimmer class, photo overlays with `bg-black/..`.
- Light/dark parity verified on generator, results, and collections.
