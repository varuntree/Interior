// types/database.ts - Database entity types matching migration schemas

// Generation Jobs
export interface GenerationJob {
  id: string;
  owner_id: string;
  mode: 'redesign' | 'staging' | 'compose' | 'imagine';
  room_type?: string;
  style?: string;
  input1_path?: string;
  input2_path?: string;
  prompt?: string;
  prediction_id?: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  error?: string;
  idempotency_key?: string;
  created_at: string;
  completed_at?: string;
}

export interface NewGenerationJob {
  owner_id: string;
  mode: 'redesign' | 'staging' | 'compose' | 'imagine';
  room_type?: string;
  style?: string;
  input1_path?: string;
  input2_path?: string;
  prompt?: string;
  prediction_id?: string;
  status?: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  error?: string;
  idempotency_key?: string;
}

// Renders
export interface Render {
  id: string;
  job_id: string;
  owner_id: string;
  mode: string;
  room_type?: string;
  style?: string;
  cover_variant: number;
  created_at: string;
}

export interface NewRender {
  job_id: string;
  owner_id: string;
  mode: string;
  room_type?: string;
  style?: string;
  cover_variant?: number;
}

// Render Variants
export interface RenderVariant {
  id: string;
  render_id: string;
  owner_id: string;
  idx: number;
  image_path: string;
  thumb_path?: string;
  created_at: string;
}

export interface NewRenderVariant {
  render_id: string;
  owner_id: string;
  idx: number;
  image_path: string;
  thumb_path?: string;
}

// Collections
export interface Collection {
  id: string;
  owner_id: string;
  name: string;
  is_default_favorites: boolean;
  created_at: string;
}

export interface NewCollection {
  owner_id: string;
  name: string;
  is_default_favorites?: boolean;
}

// Collection Items
export interface CollectionItem {
  collection_id: string;
  render_id: string;
  added_at: string;
}

export interface NewCollectionItem {
  collection_id: string;
  render_id: string;
}

// Community Collections
export interface CommunityCollection {
  id: string;
  title: string;
  description?: string;
  is_featured: boolean;
  order_index: number;
  created_at: string;
}

export interface NewCommunityCollection {
  title: string;
  description?: string;
  is_featured?: boolean;
  order_index?: number;
}

// Community Items
export interface CommunityItem {
  id: string;
  collection_id: string;
  render_id?: string;
  external_image_url?: string;
  apply_settings?: {
    mode?: string;
    roomType?: string;
    style?: string;
    prompt?: string;
  };
  order_index: number;
  created_at: string;
}

export interface NewCommunityItem {
  collection_id: string;
  render_id?: string;
  external_image_url?: string;
  apply_settings?: {
    mode?: string;
    roomType?: string;
    style?: string;
    prompt?: string;
  };
  order_index?: number;
}

// Usage Ledger
export interface UsageLedgerEntry {
  id: string;
  owner_id: string;
  kind: 'generation_debit' | 'credit_adjustment';
  amount: number;
  meta?: Record<string, any>;
  created_at: string;
}

export interface NewUsageLedgerEntry {
  owner_id: string;
  kind: 'generation_debit' | 'credit_adjustment';
  amount: number;
  meta?: Record<string, any>;
}

// Composite types for API responses
export interface RenderWithVariants extends Render {
  variants: RenderVariant[];
}

export interface CollectionWithItems extends Collection {
  items: CollectionItem[];
}

export interface CommunityCollectionWithItems extends CommunityCollection {
  items: CommunityItem[];
}
