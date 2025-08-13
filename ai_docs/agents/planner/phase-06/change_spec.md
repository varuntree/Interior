# CHANGE SPEC — Phase 6: Community & Admin Curation

## 1) Title
Add community collections system with admin curation and public browsing pages

## 2) Scope
- Add admin enrollment system via email allowlist
- Add community collections and items tables with RLS
- Add public API routes for browsing community content
- Add admin API routes for managing community content  
- Add community storage helpers for public image uploads
- Add public marketing pages for community browsing
- Add admin dashboard pages for content management

## 3) Do-Not-Touch List (repeat from handbook §0)
- Keep these files intact:
  - app/layout.tsx, app/page.tsx, app/error.tsx, app/not-found.tsx
  - app/signin/**/*, app/dashboard/**/*, app/blog/**/*, app/privacy-policy/page.tsx, app/tos/page.tsx
  - app/api/auth/callback/route.ts
  - app/api/stripe/create-checkout/route.ts
  - app/api/stripe/create-portal/route.ts
  - app/api/webhook/stripe/route.ts
  - middleware.ts, config.ts, components/**/*, libs/**/*, types/**/*

## 4) File Operations (explicit)

### 4.1 Add

#### Migrations
- `migrations/phase6/009_create_admins.sql`
```sql
create table if not exists public.admins (
  owner_id uuid primary key,
  email text unique,
  created_at timestamptz default now()
);
alter table public.admins enable row level security;

-- Only owner can read/insert/delete their admin row (self‑service "ensure me admin")
create policy "admins_owner_select" on public.admins for select
  using (auth.uid() = owner_id);
create policy "admins_owner_insert" on public.admins for insert
  with check (auth.uid() = owner_id);
create policy "admins_owner_delete" on public.admins for delete
  using (auth.uid() = owner_id);

-- Helper view to check admin capability for the current user
create or replace view public.me_is_admin as
  select true as is_admin
  from public.admins a
  where a.owner_id = auth.uid();
```

- `migrations/phase6/010_create_community.sql`
```sql
create table if not exists public.community_collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_image_url text,
  is_published boolean not null default false,
  position int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.community_collections enable row level security;

create table if not exists public.community_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.community_collections(id) on delete cascade,
  title text,
  image_url text not null,
  tags text[],
  position int default 0,
  created_at timestamptz default now()
);
alter table public.community_items enable row level security;

-- RLS: public read for published collections/items
create policy "collections_public_read" on public.community_collections for select
  using (is_published = true);
create policy "items_public_read" on public.community_items for select
  using (exists (
    select 1 from public.community_collections c
    where c.id = community_items.collection_id and c.is_published = true
  ));

-- Admin writes: allowed only if the current user appears in admins
create policy "collections_admin_all" on public.community_collections
  for all using (exists (select 1 from public.admins a where a.owner_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.owner_id = auth.uid()));

create policy "items_admin_all" on public.community_items
  for all using (exists (select 1 from public.admins a where a.owner_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.owner_id = auth.uid()));
```

#### Repositories
- `libs/repositories/admins.ts`
```ts
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AdminRow {
  owner_id: string
  email: string
  created_at: string
}

export async function ensureAdmin(
  supabase: SupabaseClient,
  args: { userId: string; email: string }
): Promise<{ isAdmin: boolean }> {
  const { data, error } = await supabase
    .from('admins')
    .upsert({
      owner_id: args.userId,
      email: args.email
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') { // unique violation
      return { isAdmin: true }
    }
    throw new Error(`Failed to ensure admin: ${error.message}`)
  }

  return { isAdmin: true }
}

export async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase
    .from('me_is_admin')
    .select('is_admin')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return false // Not found
    }
    throw new Error(`Failed to check admin status: ${error.message}`)
  }

  return data?.is_admin === true
}
```

- `libs/repositories/community.ts`
```ts
import type { SupabaseClient } from '@supabase/supabase-js'

export interface CommunityCollectionRow {
  id: string
  title: string
  description?: string
  cover_image_url?: string
  is_published: boolean
  position: number
  created_at: string
  updated_at: string
}

export interface CommunityItemRow {
  id: string
  collection_id: string
  title?: string
  image_url: string
  tags?: string[]
  position: number
  created_at: string
}

// Collections
export async function listPublishedCollections(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('community_collections')
    .select('*')
    .eq('is_published', true)
    .order('position', { ascending: true })

  if (error) throw new Error(`Failed to list published collections: ${error.message}`)
  return data
}

export async function listAllCollectionsAdmin(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('community_collections')
    .select('*')
    .order('position', { ascending: true })

  if (error) throw new Error(`Failed to list all collections: ${error.message}`)
  return data
}

export async function upsertCollection(
  supabase: SupabaseClient,
  row: Partial<CommunityCollectionRow>
) {
  const { data, error } = await supabase
    .from('community_collections')
    .upsert(row)
    .select()
    .single()

  if (error) throw new Error(`Failed to upsert collection: ${error.message}`)
  return data
}

export async function setPublished(
  supabase: SupabaseClient,
  id: string,
  isPublished: boolean
) {
  const { data, error } = await supabase
    .from('community_collections')
    .update({ is_published: isPublished })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to set published status: ${error.message}`)
  return data
}

export async function removeCollection(supabase: SupabaseClient, id: string) {
  const { error } = await supabase
    .from('community_collections')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Failed to remove collection: ${error.message}`)
}

// Items
export async function listPublishedItems(supabase: SupabaseClient, collectionId: string) {
  const { data, error } = await supabase
    .from('community_items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('position', { ascending: true })

  if (error) throw new Error(`Failed to list published items: ${error.message}`)
  return data
}

export async function listItemsAdmin(supabase: SupabaseClient, collectionId: string) {
  const { data, error } = await supabase
    .from('community_items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('position', { ascending: true })

  if (error) throw new Error(`Failed to list items: ${error.message}`)
  return data
}

export async function upsertItem(
  supabase: SupabaseClient,
  row: Partial<CommunityItemRow>
) {
  const { data, error } = await supabase
    .from('community_items')
    .upsert(row)
    .select()
    .single()

  if (error) throw new Error(`Failed to upsert item: ${error.message}`)
  return data
}

export async function removeItem(supabase: SupabaseClient, id: string) {
  const { error } = await supabase
    .from('community_items')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Failed to remove item: ${error.message}`)
}
```

#### Services
- `libs/services/admin.ts`
```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import * as adminsRepo from '@/libs/repositories/admins'

export async function bootstrapAdmin(
  ctx: { supabase: SupabaseClient },
  args: { allowlistEmails: string[]; userEmail: string; userId: string }
): Promise<{ isAdmin: boolean; message: string }> {
  if (!args.allowlistEmails.includes(args.userEmail)) {
    return { isAdmin: false, message: 'Email not on admin allowlist' }
  }

  await adminsRepo.ensureAdmin(ctx.supabase, {
    userId: args.userId,
    email: args.userEmail
  })

  return { isAdmin: true, message: 'Successfully enrolled as admin' }
}

export async function checkAdminStatus(
  ctx: { supabase: SupabaseClient }
): Promise<{ isAdmin: boolean }> {
  const isAdmin = await adminsRepo.isAdmin(ctx.supabase)
  return { isAdmin }
}
```

- `libs/services/community.ts`
```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import * as communityRepo from '@/libs/repositories/community'

export async function listPublishedCollections(ctx: { supabase: SupabaseClient }) {
  const collections = await communityRepo.listPublishedCollections(ctx.supabase)
  return { collections }
}

export async function listPublishedItems(
  ctx: { supabase: SupabaseClient },
  args: { collectionId: string }
) {
  const items = await communityRepo.listPublishedItems(ctx.supabase, args.collectionId)
  return { items }
}

export async function listAllCollections(ctx: { supabase: SupabaseClient }) {
  const collections = await communityRepo.listAllCollectionsAdmin(ctx.supabase)
  return { collections }
}

export async function upsertCollection(
  ctx: { supabase: SupabaseClient },
  args: {
    id?: string
    title: string
    description?: string
    coverImageUrl?: string
    position?: number
  }
) {
  const collection = await communityRepo.upsertCollection(ctx.supabase, {
    ...(args.id && { id: args.id }),
    title: args.title,
    description: args.description,
    cover_image_url: args.coverImageUrl,
    position: args.position
  })
  return { collection }
}

export async function togglePublished(
  ctx: { supabase: SupabaseClient },
  args: { id: string; isPublished: boolean }
) {
  const collection = await communityRepo.setPublished(
    ctx.supabase,
    args.id,
    args.isPublished
  )
  return { collection }
}

export async function deleteCollection(
  ctx: { supabase: SupabaseClient },
  args: { id: string }
) {
  await communityRepo.removeCollection(ctx.supabase, args.id)
  return null
}

export async function upsertItem(
  ctx: { supabase: SupabaseClient },
  args: {
    id?: string
    collectionId: string
    title?: string
    imageUrl: string
    tags?: string[]
    position?: number
  }
) {
  const item = await communityRepo.upsertItem(ctx.supabase, {
    ...(args.id && { id: args.id }),
    collection_id: args.collectionId,
    title: args.title,
    image_url: args.imageUrl,
    tags: args.tags,
    position: args.position
  })
  return { item }
}

export async function deleteItem(
  ctx: { supabase: SupabaseClient },
  args: { id: string }
) {
  await communityRepo.removeItem(ctx.supabase, args.id)
  return null
}
```

#### Storage Helper
- `libs/storage/community.ts`
```ts
import type { SupabaseClient } from '@supabase/supabase-js'

export async function uploadCommunityImage(
  supabase: SupabaseClient,
  params: {
    collectionId: string
    file: File | Blob
    filename: string
    contentType?: string
  }
) {
  const path = `community/${params.collectionId}/${params.filename}`
  
  const { error } = await supabase.storage
    .from('public')
    .upload(path, params.file, { 
      contentType: params.contentType,
      upsert: true
    })

  if (error) throw new Error(`Failed to upload community image: ${error.message}`)

  // Return public URL
  const { data } = supabase.storage
    .from('public')
    .getPublicUrl(path)

  return { url: data.publicUrl, path }
}

export async function deleteCommunityImage(
  supabase: SupabaseClient,
  path: string
) {
  const { error } = await supabase.storage
    .from('public')
    .remove([path])

  if (error) throw new Error(`Failed to delete community image: ${error.message}`)
}
```

#### Public API Routes
- `app/api/v1/community/collections/route.ts`
```ts
import { NextRequest } from 'next/server'
import { withMethods } from '@/libs/api-utils/handler'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { listPublishedCollections } from '@/libs/services/community'

export const GET = withMethods(['GET'], async (req: NextRequest) => {
  try {
    const supabase = createServiceSupabaseClient()
    const data = await listPublishedCollections({ supabase })
    return ok(data)
  } catch (err: any) {
    return fail(500, 'INTERNAL_ERROR', err?.message ?? 'Unexpected error')
  }
})
```

- `app/api/v1/community/collections/[id]/items/route.ts`
```ts
import { NextRequest } from 'next/server'
import { withMethods } from '@/libs/api-utils/handler'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { listPublishedItems } from '@/libs/services/community'

export const GET = withMethods(['GET'], async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const supabase = createServiceSupabaseClient()
    const data = await listPublishedItems({ supabase }, { collectionId: params.id })
    return ok(data)
  } catch (err: any) {
    return fail(500, 'INTERNAL_ERROR', err?.message ?? 'Unexpected error')
  }
})
```

#### Admin API Routes
- `app/api/v1/admin/ensure/route.ts`
```ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withMethods } from '@/libs/api-utils/handler'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { bootstrapAdmin } from '@/libs/services/admin'

export const POST = withMethods(['POST'], async (req: NextRequest) => {
  try {
    const supabase = createServiceSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required')
    }

    const allowlistEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
    
    const result = await bootstrapAdmin(
      { supabase },
      { 
        allowlistEmails,
        userEmail: user.email || '',
        userId: user.id
      }
    )

    return ok(result)
  } catch (err: any) {
    return fail(500, 'INTERNAL_ERROR', err?.message ?? 'Unexpected error')
  }
})
```

- `app/api/v1/admin/community/collections/upsert/route.ts`
```ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withMethods } from '@/libs/api-utils/handler'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { upsertCollection } from '@/libs/services/community'
import { checkAdminStatus } from '@/libs/services/admin'

const BodySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  coverImageUrl: z.string().optional(),
  position: z.number().optional()
})

export const POST = withMethods(['POST'], async (req: NextRequest) => {
  try {
    const body = await req.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return fail(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten())
    }

    const supabase = createServiceSupabaseClient()
    
    // Check admin status
    const { isAdmin } = await checkAdminStatus({ supabase })
    if (!isAdmin) {
      return fail(403, 'FORBIDDEN', 'Admin access required')
    }

    const data = await upsertCollection({ supabase }, parsed.data)
    return ok(data)
  } catch (err: any) {
    return fail(500, 'INTERNAL_ERROR', err?.message ?? 'Unexpected error')
  }
})
```

- `app/api/v1/admin/community/collections/publish/route.ts`
```ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withMethods } from '@/libs/api-utils/handler'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { togglePublished } from '@/libs/services/community'
import { checkAdminStatus } from '@/libs/services/admin'

const BodySchema = z.object({
  id: z.string().min(1),
  isPublished: z.boolean()
})

export const POST = withMethods(['POST'], async (req: NextRequest) => {
  try {
    const body = await req.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return fail(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten())
    }

    const supabase = createServiceSupabaseClient()
    
    // Check admin status
    const { isAdmin } = await checkAdminStatus({ supabase })
    if (!isAdmin) {
      return fail(403, 'FORBIDDEN', 'Admin access required')
    }

    const data = await togglePublished({ supabase }, parsed.data)
    return ok(data)
  } catch (err: any) {
    return fail(500, 'INTERNAL_ERROR', err?.message ?? 'Unexpected error')
  }
})
```

- `app/api/v1/admin/community/collections/delete/route.ts`
```ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withMethods } from '@/libs/api-utils/handler'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { deleteCollection } from '@/libs/services/community'
import { checkAdminStatus } from '@/libs/services/admin'

const BodySchema = z.object({
  id: z.string().min(1)
})

export const POST = withMethods(['POST'], async (req: NextRequest) => {
  try {
    const body = await req.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return fail(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten())
    }

    const supabase = createServiceSupabaseClient()
    
    // Check admin status
    const { isAdmin } = await checkAdminStatus({ supabase })
    if (!isAdmin) {
      return fail(403, 'FORBIDDEN', 'Admin access required')
    }

    const data = await deleteCollection({ supabase }, parsed.data)
    return ok(data)
  } catch (err: any) {
    return fail(500, 'INTERNAL_ERROR', err?.message ?? 'Unexpected error')
  }
})
```

- `app/api/v1/admin/community/items/upsert/route.ts`
```ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withMethods } from '@/libs/api-utils/handler'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { upsertItem } from '@/libs/services/community'
import { checkAdminStatus } from '@/libs/services/admin'

const BodySchema = z.object({
  id: z.string().optional(),
  collectionId: z.string().min(1),
  title: z.string().optional(),
  imageUrl: z.string().min(1),
  tags: z.array(z.string()).optional(),
  position: z.number().optional()
})

export const POST = withMethods(['POST'], async (req: NextRequest) => {
  try {
    const body = await req.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return fail(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten())
    }

    const supabase = createServiceSupabaseClient()
    
    // Check admin status
    const { isAdmin } = await checkAdminStatus({ supabase })
    if (!isAdmin) {
      return fail(403, 'FORBIDDEN', 'Admin access required')
    }

    const data = await upsertItem({ supabase }, parsed.data)
    return ok(data)
  } catch (err: any) {
    return fail(500, 'INTERNAL_ERROR', err?.message ?? 'Unexpected error')
  }
})
```

- `app/api/v1/admin/community/items/delete/route.ts`
```ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withMethods } from '@/libs/api-utils/handler'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { deleteItem } from '@/libs/services/community'
import { checkAdminStatus } from '@/libs/services/admin'

const BodySchema = z.object({
  id: z.string().min(1)
})

export const POST = withMethods(['POST'], async (req: NextRequest) => {
  try {
    const body = await req.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return fail(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten())
    }

    const supabase = createServiceSupabaseClient()
    
    // Check admin status
    const { isAdmin } = await checkAdminStatus({ supabase })
    if (!isAdmin) {
      return fail(403, 'FORBIDDEN', 'Admin access required')
    }

    const data = await deleteItem({ supabase }, parsed.data)
    return ok(data)
  } catch (err: any) {
    return fail(500, 'INTERNAL_ERROR', err?.message ?? 'Unexpected error')
  }
})
```

#### Public UI Pages
- `app/(marketing)/community/page.tsx`
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CommunityCollection {
  id: string
  title: string
  description?: string
  cover_image_url?: string
}

async function getCollections(): Promise<{ collections: CommunityCollection[] }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/v1/community/collections`, {
    cache: 'no-store'
  })
  
  if (!res.ok) {
    throw new Error('Failed to fetch collections')
  }
  
  const result = await res.json()
  return result.data
}

export default async function CommunityPage() {
  const { collections } = await getCollections()

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Community Gallery</h1>
        <p className="text-muted-foreground">
          Discover curated interior design inspiration from our community
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <Card key={collection.id} className="hover:shadow-lg transition-shadow">
            <a href={`/community/${collection.id}`}>
              {collection.cover_image_url && (
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                  <img
                    src={collection.cover_image_url}
                    alt={collection.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{collection.title}</CardTitle>
                {collection.description && (
                  <CardDescription>{collection.description}</CardDescription>
                )}
              </CardHeader>
            </a>
          </Card>
        ))}
      </div>

      {collections.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No collections published yet.</p>
        </div>
      )}
    </div>
  )
}
```

- `app/(marketing)/community/[collectionId]/page.tsx`
```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CommunityItem {
  id: string
  title?: string
  image_url: string
  tags?: string[]
}

interface CommunityCollection {
  id: string
  title: string
  description?: string
}

async function getCollectionItems(collectionId: string): Promise<{
  items: CommunityItem[]
}> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/community/collections/${collectionId}/items`,
    { cache: 'no-store' }
  )
  
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Collection not found')
    }
    throw new Error('Failed to fetch collection items')
  }
  
  const result = await res.json()
  return result.data
}

export default async function CollectionPage({
  params
}: {
  params: { collectionId: string }
}) {
  try {
    const { items } = await getCollectionItems(params.collectionId)

    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <a 
            href="/community" 
            className="text-sm text-muted-foreground hover:underline mb-4 inline-block"
          >
            ← Back to Community
          </a>
          <h1 className="text-3xl font-bold">Collection Gallery</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={item.image_url}
                  alt={item.title || 'Community item'}
                  className="object-cover w-full h-full"
                />
              </div>
              {(item.title || item.tags?.length) && (
                <CardContent className="p-4">
                  {item.title && (
                    <h3 className="font-medium text-sm mb-2">{item.title}</h3>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items in this collection yet.</p>
          </div>
        )}
      </div>
    )
  } catch (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Collection Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This collection may not exist or is not published yet.
          </p>
          <a 
            href="/community" 
            className="text-primary hover:underline"
          >
            ← Back to Community
          </a>
        </div>
      </div>
    )
  }
}
```

#### Admin UI Pages
- `app/(app)/dashboard/admin/community/page.tsx`
```tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CommunityCollection {
  id: string
  title: string
  description?: string
  cover_image_url?: string
  is_published: boolean
  position: number
}

export default function AdminCommunityPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [collections, setCollections] = useState<CommunityCollection[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImageUrl: ''
  })

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      const res = await fetch('/api/v1/admin/ensure', { method: 'POST' })
      const result = await res.json()
      
      if (result.success && result.data.isAdmin) {
        setIsAdmin(true)
        loadCollections()
      }
    } catch (error) {
      console.error('Admin check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCollections = async () => {
    try {
      const res = await fetch('/api/v1/community/collections')
      const result = await res.json()
      
      if (result.success) {
        setCollections(result.data.collections)
      }
    } catch (error) {
      console.error('Failed to load collections:', error)
    }
  }

  const handleEnsureAdmin = async () => {
    setIsLoading(true)
    await checkAdminStatus()
  }

  const handleCreateCollection = async () => {
    try {
      const res = await fetch('/api/v1/admin/community/collections/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const result = await res.json()
      
      if (result.success) {
        setShowCreateForm(false)
        setFormData({ title: '', description: '', coverImageUrl: '' })
        loadCollections()
      }
    } catch (error) {
      console.error('Failed to create collection:', error)
    }
  }

  const togglePublished = async (id: string, isPublished: boolean) => {
    try {
      const res = await fetch('/api/v1/admin/community/collections/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPublished: !isPublished })
      })
      
      if (res.ok) {
        loadCollections()
      }
    } catch (error) {
      console.error('Failed to toggle published:', error)
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              You need admin privileges to manage community content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleEnsureAdmin}>
              Request Admin Access
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Community Management</h1>
          <p className="text-muted-foreground">
            Manage collections and curated content for the community gallery.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          Create Collection
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Collection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Collection title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Collection description"
              />
            </div>
            <div>
              <Label htmlFor="coverImageUrl">Cover Image URL</Label>
              <Input
                id="coverImageUrl"
                value={formData.coverImageUrl}
                onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateCollection} disabled={!formData.title}>
                Create
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {collections.map((collection) => (
          <Card key={collection.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{collection.title}</CardTitle>
                  {collection.description && (
                    <CardDescription>{collection.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={collection.is_published ? "default" : "outline"}
                    onClick={() => togglePublished(collection.id, collection.is_published)}
                  >
                    {collection.is_published ? 'Published' : 'Unpublished'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {collection.cover_image_url && (
              <CardContent>
                <img
                  src={collection.cover_image_url}
                  alt={collection.title}
                  className="w-32 h-20 object-cover rounded"
                />
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {collections.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No collections created yet.</p>
        </div>
      )}
    </div>
  )
}
```

### 4.2 Modify

#### Environment Configuration
- `.env.example`
```
# Add to existing file
ADMIN_EMAILS=you@example.com,designer@example.com
```

## 5) Implementation Notes
- All API routes use Zod validation and normalized response format
- Admin permissions enforced via RLS policies at database level
- Uses standard supabase client (no service-role) for all operations
- Public community pages work without authentication
- Admin dashboard requires authentication and admin status
- Image uploads go to public bucket with community-specific paths
- Follows golden path: Route → Service → Repository → DB

## 6) Post‑Apply Checks (agent must run)

1. `npm run build` passes
2. Test public routes without authentication:
   - `GET /api/v1/community/collections` returns collections
   - `GET /api/v1/community/collections/{id}/items` returns items
3. Test admin routes with authentication:
   - `POST /api/v1/admin/ensure` enrolls admin if email on allowlist
   - Admin CRUD routes work with proper permissions
4. Grep checks:
   - `grep -R "use server" app libs` → 0
   - `grep -R "createServerClient" components` → 0  
   - `grep -R "service_role" app components` → 0
5. Existing routes still reachable:
   - `/`, `/signin`, `/dashboard`, `/privacy-policy`, `/tos`, `/blog`
   - Generation and collection routes work unchanged
6. New public pages load:
   - `/community` shows collections grid
   - `/community/{id}` shows collection items
7. New admin pages load:
   - `/dashboard/admin/community` shows admin panel

## 7) Rollback Plan
- Remove all files listed in section 4.1 Add
- Revert .env.example to previous content
- Run migrations rollback (if applied): DROP tables in reverse order
- Confirm `npm run build` still passes