# ShipFast — Typescript

Hey maker 👋 it's Marc from [ShipFast](https://shipfa.st/docs). Let's get your startup off the ground, FAST ⚡️

<sub>**Watch/Star the repo to be notified when updates are pushed**</sub>

## Get Started

1. Follow the [Get Started Tutorial](https://shipfa.st/docs) to clone the repo and run your local server 💻

<sub>**Looking for the /pages router version?** Use this [documentation](https://shipfa.st/docs-old) instead</sub>

2. Follow the [Ship In 5 Minutes Tutorial](https://shipfa.st/docs/tutorials/ship-in-5-minutes) to learn the foundation and ship your app quickly ⚡️

## Links

-   [📚 Documentation](https://shipfa.st/docs)
-   [📣 Updates](https://shipfast.beehiiv.com/)
-   [🧑‍💻 Discord](https://shipfa.st/dashboard)
-   [🥇 Leaderboard](https://shipfa.st/leaderboard)

## Support

Reach out at hello@shipfa.st

Let's ship it, FAST ⚡️

\_

**📈 Grow your startup with [DataFast](https://datafa.st?ref=shipfast_readme)**

-   Analyze your traffic
-   Get insights on your customers
-   Make data-driven decisions

ShipFast members get 30% OFF on all plans! 🎁

![datafast](https://github.com/user-attachments/assets/2a9710f8-9a39-4593-b4bf-9ee933529870)

## Contributor Cookbook (Baseline)

### Add a new API endpoint
1. Create a versioned Route Handler under `app/api/v1/<domain>/<name>/route.ts`.
2. Use `withMethods` from `libs/api-utils/handler`.
3. Validate input with Zod via `libs/api-utils/validate`.
4. Call a Service function (create one under `libs/services/`) and pass a Supabase server client from `libs/supabase/server`.
5. Services call Repositories in `libs/repositories/` for DB access.
6. If you must keep a legacy path working, create a tiny "bridge" file that re-exports the POST/GET from the new v1 route.

### Add a new Repository function
1. Create/modify a file under `libs/repositories/` (one file per entity).
2. Export **pure functions** that accept a `SupabaseClient` and return typed data.
3. **No HTTP logic** or `Request`/`Response` imports here.

### Add a new Service function
1. Create/modify a file under `libs/services/`.
2. Compose repositories + external SDKs (Stripe, etc.).
3. **No HTTP** here. Accept a `SupabaseClient` and plain arguments.

### Storage
- Use `libs/storage/storageRepository.ts` helpers.
- Public assets: use bucket `public`.
- Private assets: use bucket `private` with per-user path (e.g., `${userId}/file.ext`) and signed URLs.

### Migrations
- Place SQL files under `migrations/phaseX/` folders.
- **Do not apply** by default. Apply only when explicitly requested.

### Auth & Data Fetching
- Server and Client code must call **APIs** (Route Handlers).
- **No direct DB calls in pages/components** (except global auth refresh middleware).
