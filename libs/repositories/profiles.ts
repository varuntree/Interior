import type { SupabaseClient } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  email: string | null;
  customer_id: string | null;
  price_id: string | null;
  has_access: boolean;
  created_at: string | null;
  subscription_id?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
};

// READ: by user id (current session)
export async function getProfileById(db: SupabaseClient, id: string) {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Profile;
}

// READ: by email (used by webhook fallback)
export async function getProfileByEmail(db: SupabaseClient, email: string) {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();
  if (error) throw error;
  return data as Profile;
}

// UPDATE: set Stripe customer & plan, and access flag
export async function setBillingByUserId(
  db: SupabaseClient,
  params: { userId: string; customerId: string | null; priceId: string | null; hasAccess: boolean }
) {
  const { error } = await db
    .from("profiles")
    .update({
      customer_id: params.customerId,
      price_id: params.priceId,
      has_access: params.hasAccess,
    })
    .eq("id", params.userId);
  if (error) throw error;
}

// UPDATE: set access by customer_id (webhook path)
export async function setAccessByCustomerId(
  db: SupabaseClient,
  params: { customerId: string; hasAccess: boolean }
) {
  const { error } = await db
    .from("profiles")
    .update({ has_access: params.hasAccess })
    .eq("customer_id", params.customerId);
  if (error) throw error;
}

// UPDATE: set billing by customer_id (plan changes via portal)
export async function setBillingByCustomerId(
  db: SupabaseClient,
  params: { 
    customerId: string; 
    priceId?: string | null; 
    hasAccess?: boolean;
    subscriptionId?: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
  }
) {
  const patch: Record<string, any> = {}
  if (typeof params.priceId !== 'undefined') patch.price_id = params.priceId
  if (typeof params.hasAccess !== 'undefined') patch.has_access = params.hasAccess
  if (typeof params.subscriptionId !== 'undefined') patch.subscription_id = params.subscriptionId
  if (typeof params.currentPeriodStart !== 'undefined') patch.current_period_start = params.currentPeriodStart
  if (typeof params.currentPeriodEnd !== 'undefined') patch.current_period_end = params.currentPeriodEnd
  if (Object.keys(patch).length === 0) return
  const { error } = await db
    .from('profiles')
    .update(patch)
    .eq('customer_id', params.customerId)
  if (error) throw error
}
