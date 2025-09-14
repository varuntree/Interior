// libs/repositories/usage.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { NewUsageLedgerEntry, UsageLedgerEntry } from '@/types/database';

export async function debitGeneration(
  supabase: SupabaseClient,
  params: {
    ownerId: string;
    jobId: string;
    amount?: number;
    idempotencyKey?: string;
  }
): Promise<UsageLedgerEntry> {
  const { ownerId, jobId, amount = 1, idempotencyKey } = params;

  // Check for existing debit entry for this job (idempotent on jobId + optional idempotencyKey)
  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from('usage_ledger')
      .select('*')
      .eq('owner_id', ownerId)
      .contains('meta', { jobId, idempotencyKey })
      .maybeSingle()
    if (existing) return existing as UsageLedgerEntry
  } else {
    const { data: existing } = await supabase
      .from('usage_ledger')
      .select('*')
      .eq('owner_id', ownerId)
      .contains('meta', { jobId })
      .maybeSingle()
    if (existing) return existing as UsageLedgerEntry
  }

  const entry: NewUsageLedgerEntry = {
    owner_id: ownerId,
    kind: 'generation_debit',
    amount,
    meta: {
      jobId,
      ...(idempotencyKey && { idempotencyKey })
    }
  };

  const { data, error } = await supabase
    .from('usage_ledger')
    .insert(entry)
    .select()
    .single();

  if (error) throw error;
  return data as UsageLedgerEntry;
}

export async function creditAdjustment(
  supabase: SupabaseClient,
  params: {
    ownerId: string;
    amount: number;
    reason: string;
    relatedJobId?: string;
  }
): Promise<UsageLedgerEntry> {
  const { ownerId, amount, reason, relatedJobId } = params;

  const entry: NewUsageLedgerEntry = {
    owner_id: ownerId,
    kind: 'credit_adjustment',
    amount,
    meta: {
      reason,
      ...(relatedJobId && { relatedJobId })
    }
  };

  const { data, error } = await supabase
    .from('usage_ledger')
    .insert(entry)
    .select()
    .single();

  if (error) throw error;
  return data as UsageLedgerEntry;
}

export async function getMonthlyUsage(
  supabase: SupabaseClient,
  ownerId: string,
  year: number,
  month: number // 1-12
): Promise<{ debits: number; credits: number; net: number }> {
  // Calculate start and end of the month in UTC
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const { data, error } = await supabase
    .from('usage_ledger')
    .select('kind, amount')
    .eq('owner_id', ownerId)
    .gte('created_at', startDate.toISOString())
    .lt('created_at', endDate.toISOString());

  if (error) throw error;

  let debits = 0;
  let credits = 0;

  for (const entry of data || []) {
    if (entry.kind === 'generation_debit') {
      debits += entry.amount;
    } else if (entry.kind === 'credit_adjustment') {
      credits += entry.amount;
    }
  }

  return {
    debits,
    credits,
    net: debits - credits // Net usage (positive = used more than credited)
  };
}

export async function getUsageInRange(
  supabase: SupabaseClient,
  ownerId: string,
  fromIso: string,
  toIso: string
): Promise<{ debits: number; credits: number; net: number }> {
  const { data, error } = await supabase
    .from('usage_ledger')
    .select('kind, amount')
    .eq('owner_id', ownerId)
    .gte('created_at', fromIso)
    .lt('created_at', toIso)

  if (error) throw error

  let debits = 0
  let credits = 0
  for (const entry of data || []) {
    if (entry.kind === 'generation_debit') debits += entry.amount
    else if (entry.kind === 'credit_adjustment') credits += entry.amount
  }

  return { debits, credits, net: debits - credits }
}

export async function getCurrentMonthUsage(
  supabase: SupabaseClient,
  ownerId: string
): Promise<{ debits: number; credits: number; net: number }> {
  const now = new Date();
  return getMonthlyUsage(supabase, ownerId, now.getFullYear(), now.getMonth() + 1);
}

export async function getRemainingGenerations(
  supabase: SupabaseClient,
  ownerId: string,
  monthlyLimit: number
): Promise<number> {
  const usage = await getCurrentMonthUsage(supabase, ownerId);
  const remaining = monthlyLimit - usage.net;
  return Math.max(0, remaining); // Never negative
}

export async function listUsageHistory(
  supabase: SupabaseClient,
  ownerId: string,
  options?: {
    limit?: number;
    offset?: number;
    fromDate?: string;
    toDate?: string;
  }
): Promise<UsageLedgerEntry[]> {
  let query = supabase
    .from('usage_ledger')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (options?.fromDate) {
    query = query.gte('created_at', options.fromDate);
  }

  if (options?.toDate) {
    query = query.lte('created_at', options.toDate);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []) as UsageLedgerEntry[];
}
