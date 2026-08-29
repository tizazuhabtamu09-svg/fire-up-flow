import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/lib/uploads";

export type ReviewMessage = {
  id: string;
  subject_source: string;
  subject_id: string;
  owner_id: string;
  sender_id: string;
  from_staff: boolean;
  body: string;
  attachment_bucket: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  created_at: string;
};

const COLUMNS =
  "id, subject_source, subject_id, owner_id, sender_id, from_staff, body, attachment_bucket, attachment_path, attachment_name, created_at";

/** Messages for one reviewed record (used by the back office). */
export async function loadSubjectMessages(source: string, subjectId: string) {
  const { data } = await supabase
    .from("review_messages")
    .select(COLUMNS)
    .eq("subject_source", source)
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: true });
  return (data ?? []) as ReviewMessage[];
}

/** Every review message addressed to one user (used by the user-facing page). */
export async function loadOwnerMessages(ownerId: string) {
  const { data } = await supabase
    .from("review_messages")
    .select(COLUMNS)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });
  return (data ?? []) as ReviewMessage[];
}

export async function sendReviewMessage(input: {
  source: string;
  subjectId: string;
  ownerId: string;
  senderId: string;
  fromStaff: boolean;
  body: string;
  file?: File | null;
}) {
  let bucket: string | null = null;
  let path: string | null = null;
  let name: string | null = null;

  if (input.file) {
    bucket = "id-documents";
    path = await uploadFile(bucket, input.senderId, "review", input.file);
    name = input.file.name;
  }

  const { error } = await supabase.from("review_messages").insert({
    subject_source: input.source,
    subject_id: input.subjectId,
    owner_id: input.ownerId,
    sender_id: input.senderId,
    from_staff: input.fromStaff,
    body: input.body,
    attachment_bucket: bucket,
    attachment_path: path,
    attachment_name: name,
  });
  if (error) throw error;
}
