# Interior AI Deployment Guide

This guide covers deploying the Interior AI Design Generator to production environments.

## Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- Access to a Supabase project
- Stripe account with API keys
- Replicate account with API key
- Vercel account (for Vercel deployment) or equivalent hosting platform

## Environment Variables

The following environment variables must be configured in your production environment:

### Core Application
```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_live_your-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Replicate
REPLICATE_API_TOKEN=r8_your-api-token

# Security (generate random strings)
WEBHOOK_SECRET=your-webhook-secret
```

### Optional Environment Variables
```bash
# For rate limiting (if implemented)
REDIS_URL=redis://your-redis-instance

# For error tracking
SENTRY_DSN=your-sentry-dsn

# For analytics
ANALYTICS_API_KEY=your-analytics-key
```

## Database Setup

1. **Run Migrations**
   ```bash
   # Apply all migrations to your Supabase database
   # Execute each SQL file in migrations/ directory in order:
   # - migrations/phase2/*.sql
   # - migrations/phase3/*.sql
   # - migrations/phase4/*.sql
   # - migrations/phase6/*.sql
   # - migrations/phase7/*.sql
   ```

2. **Verify RLS Policies**
   - Ensure all Row Level Security policies are properly configured
   - Test authentication and data access with a test user

3. **Set Up Storage Buckets**
   ```sql
   -- Create storage buckets in Supabase
   INSERT INTO storage.buckets (id, name, public) VALUES 
   ('generation-inputs', 'generation-inputs', false),
   ('generation-outputs', 'generation-outputs', false);
   ```

## Build Process

1. **Install Dependencies**
   ```bash
   npm ci --production
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Verify Build**
   ```bash
   # Check for build errors
   npm run typecheck
   npm run lint
   ```

## Deployment Options

### Vercel Deployment (Recommended)

1. **Connect Repository**
   - Link your GitHub repository to Vercel
   - Configure build settings:
     - Build Command: `npm run build`
     - Output Directory: `.next`
     - Node.js Version: 18.x

2. **Configure Environment Variables**
   - Add all required environment variables in Vercel dashboard
   - Set up production and preview environments

3. **Configure Domains**
   - Set up custom domain
   - Configure DNS records
   - Enable HTTPS (automatic with Vercel)

4. **Deploy**
   ```bash
   # Using Vercel CLI
   vercel --prod
   ```

### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS base
   
   # Install dependencies only when needed
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   COPY package.json package-lock.json ./
   RUN npm ci --frozen-lockfile
   
   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   ENV NEXT_TELEMETRY_DISABLED 1
   RUN npm run build
   
   # Production image
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production
   ENV NEXT_TELEMETRY_DISABLED 1
   
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   
   USER nextjs
   EXPOSE 3000
   ENV PORT 3000
   ENV HOSTNAME "0.0.0.0"
   
   CMD ["node", "server.js"]
   ```

2. **Build and Deploy**
   ```bash
   docker build -t interior-ai .
   docker run -p 3000:3000 interior-ai
   ```

## Post-Deployment Configuration

### 1. Stripe Webhooks

Configure Stripe webhooks to point to your production domain:

```
Webhook URL: https://your-domain.com/api/v1/webhooks/stripe
Events: customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, invoice.payment_succeeded, invoice.payment_failed
```

### 2. Replicate Webhooks

Configure Replicate webhooks for generation status updates:

```
Webhook URL: https://your-domain.com/api/v1/webhooks/replicate
```

### 3. DNS Configuration

Set up proper DNS records:
```
A record: @ -> your-server-ip
CNAME: www -> your-domain.com
```

### 4. SSL/TLS Certificate

Ensure HTTPS is properly configured:
- Vercel: Automatic
- Custom hosting: Use Let's Encrypt or equivalent

## Monitoring and Logging

### 1. Application Monitoring

Set up monitoring for:
- Response times
- Error rates
- Database performance
- Generation queue status

### 2. Log Aggregation

Configure log aggregation:
```bash
# Example with structured logging
npm install winston
```

### 3. Health Checks

Monitor these endpoints:
- `GET /api/v1/health` - Application health
- `GET /api/v1/status` - Database connectivity

## Security Checklist

- [ ] Environment variables are properly secured
- [ ] HTTPS is enforced
- [ ] Security headers are configured (see next.config.js)
- [ ] Database RLS policies are active
- [ ] API rate limiting is configured
- [ ] Webhook signatures are verified
- [ ] Service keys are rotated regularly

## Performance Optimization

### 1. CDN Configuration

Configure CDN for static assets:
- Images: Use Next.js Image optimization
- Fonts: Preload critical fonts
- CSS/JS: Enable compression

### 2. Database Optimization

- Index frequently queried columns
- Monitor slow queries
- Set up connection pooling

### 3. Caching Strategy

- API responses use appropriate cache headers
- Static assets have long cache times
- User-specific data has short cache times

## Backup and Recovery

### 1. Database Backups

Set up automated backups:
- Supabase: Automatic backups included
- Self-hosted: Configure pg_dump schedules

### 2. File Storage Backups

Backup generation inputs/outputs:
- Supabase Storage: Built-in redundancy
- External storage: Regular snapshots

### 3. Disaster Recovery Plan

1. Document recovery procedures
2. Test backup restoration
3. Define RTO/RPO targets
4. Set up monitoring alerts

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check connection string format
   - Confirm IP allowlisting

3. **Image Upload Failures**
   - Check storage bucket permissions
   - Verify file size limits
   - Confirm CORS configuration

4. **Webhook Failures**
   - Verify webhook signatures
   - Check endpoint accessibility
   - Review error logs

### Debug Commands

```bash
# Check application health
curl https://your-domain.com/api/v1/health

# Verify database connectivity
curl https://your-domain.com/api/v1/status

# Check build info
npm run build --verbose
```

## Maintenance

### Regular Tasks

1. **Weekly**
   - Review error logs
   - Check performance metrics
   - Monitor storage usage

2. **Monthly**
   - Update dependencies
   - Review security alerts
   - Optimize database queries

3. **Quarterly**
   - Security audit
   - Performance review
   - Backup testing

### Updates

1. **Dependency Updates**
   ```bash
   npm audit
   npm update
   npm run test
   ```

2. **Security Patches**
   - Monitor security advisories
   - Test patches in staging
   - Deploy with rollback plan

## Support

For deployment issues:
- Check application logs
- Review environment configuration
- Verify external service connectivity
- Contact support with error details and environment information
