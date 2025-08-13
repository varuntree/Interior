# Interior AI Admin Guide

This guide covers administrative tasks and management of the Interior AI Design Generator platform.

## Overview

As an admin, you can:
- Manage community collections and content
- Monitor user activity and generation usage
- Handle customer support requests
- Manage system configuration
- Monitor application health

## Admin Access

### Database Access

Admin operations typically require direct database access through Supabase:

1. **Access Supabase Dashboard**
   - Navigate to your Supabase project dashboard
   - Use the SQL Editor for direct queries
   - Access the Table Editor for visual data management

2. **Admin User Setup**
   ```sql
   -- Grant admin privileges to a user
   UPDATE profiles 
   SET role = 'admin' 
   WHERE id = 'user-uuid-here';
   ```

## Community Content Management

### Managing Collections

Community collections are curated galleries displayed on the community page.

#### Creating a Collection
```sql
-- Create a new community collection
INSERT INTO community_collections (
  title,
  description,
  is_featured,
  is_published,
  order_index
) VALUES (
  'Modern Minimalist Homes',
  'Clean lines and simple elegance',
  true,
  true,
  1
);
```

#### Adding Items to Collections
```sql
-- Add a render to a community collection
INSERT INTO community_collection_items (
  collection_id,
  render_id,
  apply_settings,
  order_index
) VALUES (
  'collection-uuid',
  'render-uuid',
  '{"mode": "redesign", "style": "Modern", "roomType": "Living Room", "prompt": "minimalist modern living room"}',
  1
);

-- Add an external image to a collection
INSERT INTO community_collection_items (
  collection_id,
  image_url,
  thumb_url,
  apply_settings,
  order_index,
  source_type
) VALUES (
  'collection-uuid',
  'https://example.com/image.jpg',
  'https://example.com/thumb.jpg',
  '{"mode": "imagine", "style": "Coastal AU", "roomType": "Bedroom", "prompt": "coastal bedroom with natural light"}',
  2,
  'external'
);
```

#### Managing Collection Visibility
```sql
-- Feature a collection (show in featured section)
UPDATE community_collections 
SET is_featured = true 
WHERE id = 'collection-uuid';

-- Publish/unpublish a collection
UPDATE community_collections 
SET is_published = true 
WHERE id = 'collection-uuid';

-- Reorder collections
UPDATE community_collections 
SET order_index = 1 
WHERE id = 'collection-uuid';
```

### Content Moderation

#### Review User-Generated Content
```sql
-- Find recent renders for review
SELECT r.*, p.email as user_email
FROM renders r
JOIN profiles p ON r.owner_id = p.id
WHERE r.created_at > NOW() - INTERVAL '24 hours'
ORDER BY r.created_at DESC;

-- Check for inappropriate content
SELECT *
FROM renders
WHERE prompt ILIKE '%inappropriate_keyword%'
ORDER BY created_at DESC;
```

#### Remove Inappropriate Content
```sql
-- Delete a render and its variants
DELETE FROM render_variants WHERE render_id = 'render-uuid';
DELETE FROM renders WHERE id = 'render-uuid';

-- Remove from collections if needed
DELETE FROM collection_items WHERE render_id = 'render-uuid';
```

## User Management

### User Analytics
```sql
-- Active users in the last 30 days
SELECT COUNT(DISTINCT owner_id) as active_users
FROM generations
WHERE created_at > NOW() - INTERVAL '30 days';

-- Top users by generation count
SELECT 
  p.email,
  COUNT(g.id) as generation_count,
  MAX(g.created_at) as last_activity
FROM profiles p
JOIN generations g ON p.id = g.owner_id
GROUP BY p.id, p.email
ORDER BY generation_count DESC
LIMIT 20;

-- Users approaching limits
SELECT 
  p.email,
  p.price_id,
  COUNT(u.id) as usage_this_month
FROM profiles p
LEFT JOIN usage u ON p.id = u.owner_id 
  AND u.created_at > DATE_TRUNC('month', NOW())
GROUP BY p.id, p.email, p.price_id
HAVING COUNT(u.id) > 80
ORDER BY usage_this_month DESC;
```

### Account Management
```sql
-- Reset user's monthly usage (emergency only)
DELETE FROM usage 
WHERE owner_id = 'user-uuid'
AND created_at > DATE_TRUNC('month', NOW());

-- Check user's subscription status
SELECT 
  p.email,
  p.price_id,
  p.customer_id,
  p.created_at as signup_date
FROM profiles p
WHERE p.id = 'user-uuid';

-- Grant temporary access
UPDATE profiles 
SET price_id = 'price_starter' 
WHERE id = 'user-uuid';
```

## Usage Monitoring

### System Health Checks
```sql
-- Check generation success rates
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM generations
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Average generation time
SELECT 
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_seconds
FROM generations
WHERE status = 'succeeded'
AND completed_at > NOW() - INTERVAL '24 hours';

-- Storage usage
SELECT 
  SUM(CASE WHEN source_type = 'render' THEN 1 ELSE 0 END) as internal_images,
  COUNT(*) as total_community_items
FROM community_collection_items;
```

### Error Monitoring
```sql
-- Recent failed generations
SELECT 
  g.id,
  g.owner_id,
  g.mode,
  g.error,
  g.created_at,
  p.email
FROM generations g
JOIN profiles p ON g.owner_id = p.id
WHERE g.status = 'failed'
AND g.created_at > NOW() - INTERVAL '24 hours'
ORDER BY g.created_at DESC;

-- Common error patterns
SELECT 
  error,
  COUNT(*) as occurrences
FROM generations
WHERE status = 'failed'
AND created_at > NOW() - INTERVAL '7 days'
GROUP BY error
ORDER BY occurrences DESC;
```

## Customer Support

### Common Support Tasks

#### User Can't Access Generations
1. Check subscription status:
   ```sql
   SELECT price_id, customer_id FROM profiles WHERE email = 'user@example.com';
   ```

2. Verify usage limits:
   ```sql
   SELECT COUNT(*) as usage_this_month
   FROM usage u
   JOIN profiles p ON u.owner_id = p.id
   WHERE p.email = 'user@example.com'
   AND u.created_at > DATE_TRUNC('month', NOW());
   ```

3. Check for failed payments in Stripe dashboard

#### Generation Stuck in Processing
1. Find the generation:
   ```sql
   SELECT * FROM generations 
   WHERE owner_id = 'user-uuid'
   AND status IN ('processing', 'starting')
   ORDER BY created_at DESC;
   ```

2. Check Replicate prediction status (manual API call)

3. Mark as failed if necessary:
   ```sql
   UPDATE generations 
   SET status = 'failed', error = 'Timeout - generation stuck'
   WHERE id = 'generation-uuid';
   ```

#### Billing Issues
1. Check Stripe customer ID:
   ```sql
   SELECT customer_id, price_id FROM profiles WHERE email = 'user@example.com';
   ```

2. Verify subscription in Stripe dashboard
3. Update local records if needed:
   ```sql
   UPDATE profiles 
   SET price_id = 'correct_price_id'
   WHERE email = 'user@example.com';
   ```

### Support Response Templates

#### Generation Failed
```
Hi [User Name],

I've investigated the issue with your generation. It appears there was a temporary service issue that caused your generation to fail.

I've credited your account with a free generation to compensate for the inconvenience. Please try generating again, and let me know if you encounter any further issues.

Best regards,
Interior AI Support Team
```

#### Billing Question
```
Hi [User Name],

Thank you for contacting us about your subscription. I've reviewed your account and can confirm:

- Current Plan: [Plan Name]
- Monthly Generations: [Number]
- Usage This Month: [Number]
- Next Billing Date: [Date]

[Additional specific response to their question]

If you have any other questions, please don't hesitate to reach out.

Best regards,
Interior AI Support Team
```

## System Configuration

### Runtime Configuration

Update the runtime configuration for plans, features, and limits:

```typescript
// In config.ts or runtime configuration
export const runtimeConfig = {
  plans: {
    'price_free': {
      id: 'free',
      label: 'Free',
      monthlyGenerations: 5,
      priceAudPerMonth: 0,
      // ... other settings
    },
    // ... other plans
  }
};
```

### Feature Flags

Enable/disable features system-wide:

```sql
-- Create a feature flags table (if not exists)
CREATE TABLE IF NOT EXISTS feature_flags (
  id SERIAL PRIMARY KEY,
  flag_name VARCHAR(100) UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert feature flags
INSERT INTO feature_flags (flag_name, is_enabled, description) VALUES
('community_collections', true, 'Enable community collections feature'),
('advanced_settings', false, 'Enable advanced generation settings'),
('batch_generation', false, 'Enable batch generation feature');
```

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Generation Success Rate**
   - Target: >95% success rate
   - Alert if <90% in 1 hour period

2. **Average Response Time**
   - Target: <500ms for API responses
   - Alert if >1000ms average over 5 minutes

3. **User Satisfaction**
   - Monitor support ticket volume
   - Track feature usage patterns

4. **Resource Usage**
   - Database connection count
   - Storage bucket usage
   - API rate limits

### Setting Up Alerts

Create monitoring queries that can be run regularly:

```sql
-- Alert: High failure rate
SELECT 
  CASE 
    WHEN failure_rate > 10 THEN 'ALERT'
    ELSE 'OK'
  END as status,
  failure_rate
FROM (
  SELECT 
    ROUND(
      COUNT(CASE WHEN status = 'failed' THEN 1 END) * 100.0 / COUNT(*), 
      2
    ) as failure_rate
  FROM generations
  WHERE created_at > NOW() - INTERVAL '1 hour'
) stats;
```

## Maintenance Tasks

### Daily Tasks
- [ ] Review failed generations
- [ ] Check system health metrics
- [ ] Monitor error rates
- [ ] Review support queue

### Weekly Tasks
- [ ] Analyze user growth metrics
- [ ] Review community content submissions
- [ ] Update featured collections
- [ ] Performance optimization review

### Monthly Tasks
- [ ] Generate usage reports
- [ ] Plan feature releases
- [ ] Review and optimize database performance
- [ ] Security audit

## Emergency Procedures

### Service Outage
1. Check external service status (Supabase, Replicate, Stripe)
2. Review application logs
3. Verify database connectivity
4. Check webhook endpoints
5. Communicate with users if extended outage

### Data Recovery
1. Identify affected data
2. Check available backups
3. Coordinate with Supabase support if needed
4. Test recovery in staging environment
5. Execute recovery with minimal downtime

### Security Incident
1. Assess scope of potential breach
2. Rotate API keys if compromised
3. Review access logs
4. Implement additional security measures
5. Notify users if personal data affected

## Useful SQL Queries

### Performance Analysis
```sql
-- Slowest API endpoints (requires logging)
SELECT 
  endpoint,
  AVG(response_time_ms) as avg_response_time,
  COUNT(*) as request_count
FROM api_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY endpoint
ORDER BY avg_response_time DESC;

-- Database query performance
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

### Business Intelligence
```sql
-- Revenue by plan
SELECT 
  price_id,
  COUNT(*) as subscribers,
  CASE 
    WHEN price_id = 'price_starter' THEN COUNT(*) * 19
    WHEN price_id = 'price_pro' THEN COUNT(*) * 49
    ELSE 0
  END as monthly_revenue_aud
FROM profiles
WHERE price_id IS NOT NULL
GROUP BY price_id;

-- Feature usage
SELECT 
  mode,
  COUNT(*) as usage_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM generations
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY mode
ORDER BY usage_count DESC;
```

## Contact Information

For admin-level issues that require escalation:
- Technical Issues: Check application logs and database
- External Service Issues: Contact Supabase, Replicate, or Stripe support
- Security Concerns: Follow security incident procedures
- Infrastructure Issues: Review hosting platform status

Remember to always test changes in a staging environment before applying them to production.