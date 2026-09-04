import { supabase } from "@/integrations/supabase/client";

export const APPLICATION_BUCKET = "applications";

/** Uploads a CV / education document into the private applications bucket. */
export async function uploadApplicationFile(jobId: string, file: File, kind: "cv" | "education") {
  const ext = file.name.split(".").pop() || "pdf";
  const path = `${jobId}/${kind}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(APPLICATION_BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

/** Signed link an employer or staff member can open. */
export async function applicationFileUrl(path: string | null | undefined) {
  if (!path) return null;
  const { data } = await supabase.storage.from(APPLICATION_BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
