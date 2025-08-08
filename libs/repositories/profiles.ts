import type { SupabaseClient } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  email: string | null;
  customer_id: string | null;
  price_id: string | null;
  has_access: boolean;
  created_at: string | null;
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