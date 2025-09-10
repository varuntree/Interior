# Interior AI Design Generator

An AI-powered interior design generation platform for the Australian market. Create stunning redesigns, virtual staging, composition, and imagination-based interior designs using advanced AI models.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm (included with Node.js)

### For Generation Features (Webhook Support)

The generation features use webhooks from external services. In development, you can run the app normally at `http://localhost:3000`. For testing webhooks locally, use any method to expose a public HTTPS URL to your dev server or deploy a preview to your hosting provider.

#### Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local.example .env.local

# 3. Start development server
npm run dev
```

### Run Locally with grok (public HTTPS + webhooks)

Use grok to expose your local server so Replicate and Stripe webhooks can reach it.

```bash
# 0) Prereqs
# - Node 18+, npm
# - grok installed and on PATH
# - Stripe CLI installed (for Stripe webhooks)

# 1) Env setup
cp .env.example .env.local
$EDITOR .env.local   # Fill required vars:
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
# REPLICATE_API_TOKEN
# STRIPE_SECRET_KEY (and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY if used)

# 2) Start the app
npm install
npm run dev

# 3) Start grok tunnel to your dev server
grok http 3000
# Copy the printed HTTPS URL (e.g., https://random.grok.dev)

# 4) Point the app at your grok URL (enables proper webhook URLs)
echo "PUBLIC_BASE_URL=https://random.grok.dev" >> .env.local
echo "NEXT_PUBLIC_APP_URL=https://random.grok.dev" >> .env.local

# Restart dev to pick up env changes
^C && npm run dev

# 5) Wire Stripe webhook (optional if not testing billing)
stripe login
stripe listen --forward-to https://random.grok.dev/api/v1/webhooks/stripe
# Put the printed signing secret into STRIPE_WEBHOOK_SECRET in .env.local, then restart dev

# 6) Health checks (confirm routing through grok)
curl https://random.grok.dev/api/v1/health
curl https://random.grok.dev/api/v1/status
```

Notes
- Replicate webhook is built as `PUBLIC_BASE_URL + /api/v1/webhooks/replicate`, so setting `PUBLIC_BASE_URL` to your grok URL is sufficient.
- If the grok URL changes, update `PUBLIC_BASE_URL` and `NEXT_PUBLIC_APP_URL` in `.env.local` and restart `npm run dev`.
- You can skip Stripe wiring if you aren’t testing billing flows.

### Environment Variables

Create `.env.local` from `.env.local.example` and configure:

**Required:**
- `NEXT_PUBLIC_APP_URL` - Your public URL (e.g., http://localhost:3000 for dev, https://your-domain.com for prod)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `REPLICATE_API_TOKEN` - Replicate API token for AI generation
- `OPENAI_API_KEY` - OpenAI API key (REQUIRED for gpt-image-1 model)
- `STRIPE_SECRET_KEY` - Stripe secret key for billing
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

**Optional:**
- `WEBHOOK_SECRET` - Custom webhook verification secret
- `SENTRY_DSN` - Error tracking (if using Sentry)

### OpenAI API Key Requirement

The image generation uses OpenAI's GPT-Image-1 model through Replicate, which requires:

- **Valid OpenAI API Key**: Get from [OpenAI API Keys](https://platform.openai.com/api-keys)
- **Image Generation Access**: Ensure your OpenAI account has image generation enabled
- **Sufficient Credits**: You'll be charged by OpenAI for each image generated
- **Dual Billing**: You pay both Replicate (platform) and OpenAI (model usage)

**Important**: You need BOTH `REPLICATE_API_TOKEN` AND `OPENAI_API_KEY` for generation to work.

**Cost Estimate per Image**:
- Replicate Platform Fee: ~$0.01-0.02
- OpenAI API Usage: ~$0.02-0.04  
- **Total**: ~$0.03-0.06 per image

## 🏗️ Architecture

This application follows a strict architectural pattern:

```
UI Components → API Routes → Services → Repositories → Database
```

### Key Principles
- **No Server Actions** - All data flows through API routes
- **No direct DB calls** from components - Use API endpoints
- **Service layer** handles business logic
- **Repository layer** handles data access
- **Mobile-first** responsive design

### Directory Structure
```
app/                    # Next.js App Router pages
├── (app)/             # Private dashboard pages
├── (marketing)/       # Public marketing pages
└── api/v1/           # API endpoints
components/            # React components
├── ui/               # shadcn/ui components
├── generation/       # Generation-specific components
└── dashboard/        # Dashboard components
libs/
├── services/         # Business logic
├── repositories/     # Database access
├── api-utils/        # API utilities
└── app-config/       # Runtime configuration
```

## 🎨 Features

### Generation Modes
1. **Redesign** - Keep room structure, change furnishings and style
2. **Staging** - Add furniture to empty or partially furnished rooms
3. **Compose** - Merge two images (base room + reference style)
4. **Imagine** - Generate rooms from text descriptions only

### Organization
- **My Renders** - All generated designs auto-saved
- **Collections** - Custom folders + default "My Favorites"
- **Community** - Curated inspiration galleries

### Australian Focus
- AU-specific room types (Alfresco, Granny Flat)
- AU-oriented styles (Coastal AU, Hamptons AU, etc.)
- Local design sensibilities and materials

## 🛠️ Development

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run typecheck  # TypeScript type checking
npm run lint       # ESLint checking
npm run verify:grep # Guardrails (forbidden patterns)
npm run test       # Unit tests (prompt builder + replicate adapter)
```

### Codebase Standards & Cleanup Docs

This repo follows a strict, documented architecture and coding standard to keep changes fast and reliable.

- Codebase Cleaning docs (plans, audits, standards, changelog): `ai_docs/codebase_cleaning/`
  - Start with `ai_docs/codebase_cleaning/01-guiding-principles.md`
  - See per‑phase plans under `ai_docs/codebase_cleaning/phased plans/`
- Golden path: Route → Service → Repository → DB; no Server Actions; no direct DB/storage in components.
- API responses: always `{ success, data? | error? }` via `libs/api-utils/responses`.

### Adding New Features

#### Add an API Endpoint
1. Create `app/api/v1/<domain>/<action>/route.ts`
2. Use `withMethods` from `libs/api-utils/methods`
3. Validate input with Zod
4. Call service function
5. Return normalized JSON response

#### Add Business Logic
1. Create/modify files under `libs/services/`
2. Compose repositories + external SDKs
3. Keep HTTP logic out of services
4. Use dependency injection pattern

#### Add Database Access
1. Create/modify files under `libs/repositories/`
2. Export pure functions accepting `SupabaseClient`
3. No HTTP imports or logic
4. Return typed data

## 🔧 Troubleshooting

### Generation Fails with "Not a valid HTTPS URL"
This means the webhook URL is not properly configured:

1. **Check environment variable:**
   ```bash
   # Ensure NEXT_PUBLIC_APP_URL is set appropriately
   # e.g., http://localhost:3000 for dev or your HTTPS domain in prod
   echo $NEXT_PUBLIC_APP_URL
   ```

2. **Verify webhook endpoint:**
   It should resolve under your public base URL, for example: `https://your-domain.com/api/v1/webhooks/replicate`

### Generation Fails with "openai_api_key is required"
This means your OpenAI API key is not configured:

1. **Get OpenAI API Key:**
   - Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
   - Create a new secret key
   - Ensure your account has image generation access

2. **Configure in environment:**
   ```bash
   # Add to .env.local
   OPENAI_API_KEY=sk-your-actual-api-key-here
   
   # Restart development server
   npm run dev
   ```

3. **Verify both keys are set:**
   ```bash
   # Check both required keys are present
   grep -E "(REPLICATE_API_TOKEN|OPENAI_API_KEY)" .env.local
   ```

### Common Issues

**Port 3000 already in use:**
```bash
# Kill process on port 3000
npx kill-port 3000
npm run dev
```

**Environment variables not loading:**
```bash
# Restart development server after changing .env.local
# Ensure no trailing spaces in environment variable values
```

**TypeScript errors:**
```bash
npm run typecheck  # Check for type errors
npm run build      # Ensure build passes
```

## 🚢 Deployment

### Environment Setup
1. Set all required environment variables in your hosting platform
2. Ensure `NEXT_PUBLIC_APP_URL` points to your production domain
3. Use HTTPS URLs for all external integrations

### Build Process
```bash
npm run build      # Creates optimized production build
npm run start      # Starts production server
```

### Webhooks Configuration
Update webhook URLs in external services:
- **Stripe:** `https://yourdomain.com/api/v1/webhooks/stripe`
- **Replicate:** `https://yourdomain.com/api/v1/webhooks/replicate`

## 🧪 Testing

### Manual Testing Checklist
- [ ] Sign in with Google OAuth
- [ ] Generate image using Imagine mode
- [ ] Save result to My Favorites
- [ ] View result in My Renders
- [ ] Create custom collection
- [ ] Browse community gallery

### Automated Checks
```bash
npm run typecheck  # TypeScript validation
npm run lint      # Code style validation
npm run build     # Build validation
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Replicate Documentation](https://replicate.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

## 🤝 Contributing

1. Follow the established architecture patterns
2. Use the provided templates for new features
3. Ensure all tests pass before submitting
4. Update documentation for new features

## 📄 License

[Add your license information here]

---

**Need help?** Check the troubleshooting section above or review the setup instructions.
