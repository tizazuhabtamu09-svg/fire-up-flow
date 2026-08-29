import { supabase } from "@/integrations/supabase/client";

/** Upload a file into a private bucket under the user's own folder. Returns the storage path. */
export async function uploadFile(
  bucket: string,
  userId: string,
  label: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${userId}/${label}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

/** Create a short-lived signed URL for a private object. */
export async function signedUrl(bucket: string, path: string, seconds = 600) {
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, seconds);
  return data?.signedUrl ?? null;
}

export async function openSigned(bucket: string, path: string) {
  const url = await signedUrl(bucket, path, 60);
  if (url) window.open(url, "_blank", "noopener");
}
