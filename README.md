# Interior AI Design Generator

An AI-powered interior design generation platform for the Australian market. Create stunning redesigns, virtual staging, composition, and imagination-based interior designs using advanced AI models.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm (included with Node.js)
- A free [ngrok](https://ngrok.com) account (for local development)

### For Generation Features (Webhook Support Required)

The generation features require webhook support from external services. This means your local development server needs to be accessible via HTTPS from the internet.

#### Option 1: Automated Setup (Recommended)
```bash
# Clone and set up the project
git clone <repository-url>
cd Interior
npm install
npm run setup
```

The setup script will:
- Install ngrok if not present
- Create `.env.local` from example
- Guide you through configuration
- Set up the development environment

#### Option 2: Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local.example .env.local

# 3. Install ngrok
npm install -g ngrok

# 4. Start ngrok tunnel
ngrok http 3000
# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)

# 5. Update .env.local
# Set NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io

# 6. Start development server
npm run dev
```

### Environment Variables

Create `.env.local` from `.env.local.example` and configure:

**Required:**
- `NEXT_PUBLIC_APP_URL` - Your public URL (ngrok for development)
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
npm run dev              # Start development server
npm run dev:setup       # Run setup script for new developers
npm run dev:tunnel      # Start ngrok tunnel
npm run build           # Build for production
npm run typecheck       # TypeScript type checking
npm run lint            # ESLint checking
npm run setup           # Complete project setup
```

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
   # Ensure NEXT_PUBLIC_APP_URL is set in .env.local
   echo $NEXT_PUBLIC_APP_URL
   ```

2. **Restart ngrok and update URL:**
   ```bash
   # Start new ngrok session
   ngrok http 3000
   
   # Copy new HTTPS URL to .env.local
   # Restart development server
   npm run dev
   ```

3. **Verify webhook endpoint:**
   Your webhook URL should be: `https://your-subdomain.ngrok.io/api/v1/webhooks/replicate`

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