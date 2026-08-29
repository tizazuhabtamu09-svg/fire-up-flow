import { supabase } from "@/integrations/supabase/client";
import { resolveAvatars } from "@/lib/employees";
import type { Database } from "@/integrations/supabase/types";

export type WorkerRecord = Database["public"]["Tables"]["workers"]["Row"];

/** What the current viewer is allowed to do on an employee profile. */
export type ProfileAccess = {
  /** Every field captured at registration (documents, guarantor, contacts). */
  full: boolean;
  /** Admin-only: change any field. */
  canEdit: boolean;
  /** The employee themselves: read-only except the availability switch. */
  isSelf: boolean;
  /** Broker who registered this employee. */
  ownsRecord: boolean;
};

export function resolveAccess({
  worker,
  userId,
  role,
  isAdmin,
}: {
  worker: WorkerRecord | null;
  userId: string | undefined;
  role: string | undefined;
  isAdmin: boolean;
}): ProfileAccess {
  const isSelf = Boolean(worker && userId && worker.user_id === userId);
  const ownsRecord = Boolean(worker && userId && role === "broker" && worker.owner_id === userId);
  return {
    full: isAdmin || isSelf || ownsRecord,
    canEdit: isAdmin,
    isSelf,
    ownsRecord,
  };
}

/**
 * Loads the raw worker record. RLS decides what comes back: admins, the
 * employee themselves and the registering broker get the row, everyone else
 * gets null and the caller falls back to the public view.
 */
export async function loadWorkerRecord(id: string): Promise<WorkerRecord | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) return null;
  const { data } = await supabase.from("workers").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function workerPhotoUrl(photoPath: string | null | undefined) {
  if (!photoPath) return null;
  const signed = await resolveAvatars([photoPath]);
  return signed[photoPath] ?? null;
}

export async function setWorkerAvailability(id: string, available: boolean) {
  const { error } = await supabase.from("workers").update({ available }).eq("id", id);
  if (error) throw error;
}
