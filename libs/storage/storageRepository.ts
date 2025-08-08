import type { SupabaseClient } from "@supabase/supabase-js";

// Public bucket: read by anyone; writes only by authenticated users
export async function uploadPublic(db: SupabaseClient, path: string, file: File | Blob) {
  const { error } = await db.storage.from("public").upload(path, file, { upsert: true });
  if (error) throw error;
  return getPublicUrl(db, path);
}

export function getPublicUrl(db: SupabaseClient, path: string) {
  const { data } = db.storage.from("public").getPublicUrl(path);
  return data.publicUrl;
}

// Private bucket: per-user folder, signed URLs for read
export async function uploadPrivate(
  db: SupabaseClient,
  userId: string,
  path: string,
  file: File | Blob
) {
  const key = `${userId}/${path}`;
  const { error } = await db.storage.from("private").upload(key, file, { upsert: true });
  if (error) throw error;
  return key;
}

export async function getPrivateSignedUrl(db: SupabaseClient, key: string, expiresInSeconds = 60) {
  const { data, error } = await db.storage.from("private").createSignedUrl(key, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}