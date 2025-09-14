# UI Feature Flags — Collections & Community

Purpose
- Provide a single, UI-only switch to hide advanced features (Collections and Community) while keeping all backend logic and data intact. This is reversible in seconds and avoids migrations or API changes.

Source of Truth
- File: `libs/app-config/runtime.ts`
- Flags:
  - `featureFlags.collections: boolean`
  - `featureFlags.community: boolean`

What These Flags Do (UI Only)
- Navigation: hides sidebar items for “Collections” and “Community”.
- Dashboard Pages:
  - `/dashboard/collections` and `/dashboard/collections/[id]` are guarded and show a friendly fallback + links when disabled.
  - `/dashboard/community` is guarded similarly.
- My Renders page:
  - Hides Favorite and Add-to-Collection actions and the collection picker dialog.
  - Hides any “favorite” state indicators when Collections are disabled.
- Results Grid (generation results):
  - Disables favorite/collection actions.
- Marketing:
  - Community marketing page is guarded with a fallback.
  - “How it works” step “Save your favorites” is hidden when Collections are disabled.
  - Pricing features conditionally omit “Collections & favorites”.

What These Flags Do NOT Change
- APIs and DB schema remain enabled and unchanged. Endpoints will still exist; the UI simply hides all entry points. This preserves advanced functionality for future use without rework.

How to Toggle
1) Open `libs/app-config/runtime.ts`.
2) Edit:
```ts
featureFlags: { community: false, collections: false }
```
3) Redeploy.

Verification Checklist (When OFF)
- Sidebar shows only “Create” and “My Renders”.
- Visiting `/dashboard/collections*` and `/dashboard/community` shows a disabled-feature fallback with links back.
- My Renders shows no heart or folder icons; no collection picker. Favorites state does not appear.
- Marketing “How it works” does not mention favorites/collections.
- Marketing community page shows a disabled-feature fallback.

Verification Checklist (When ON)
- Sidebar items reappear.
- Collections and Community pages function as before.
- My Renders actions (favorites, add-to-collection) work and dialogs appear.
- Marketing pages show normal content.

Notes
- This is intentionally UI-only to minimize risk and keep the feature dormant, not removed.
- If you later need server-side gating, add a tiny route wrapper that returns 404 when flags are off. For now, UI-only keeps things simple.

