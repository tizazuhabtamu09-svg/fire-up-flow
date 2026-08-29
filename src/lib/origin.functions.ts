import { createServerFn } from "@tanstack/react-start";
import { requireAuth as requireSupabaseAuth } from "@/lib/auth-guard";

export type OriginInfo = { type: string | null; byName: string | null } | null;

/**
 * Registration origin metadata for one worker or profile record.
 * Returns null for anyone who is not a full Admin — the creator identity is
 * deliberately hidden from brokers, sub-admins, employers and workers.
 */
export const getRegistrationOrigin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { table: "workers" | "profiles"; id: string }) => {
    if (input.table !== "workers" && input.table !== "profiles") throw new Error("Unsupported record type.");
    if (!input.id) throw new Error("Missing record id.");
    return input;
  })
  .handler(async ({ data, context }): Promise<OriginInfo> => {
    const { supabase, userId } = context;

    const [{ data: isAdmin }, { data: sub }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
      supabase.from("sub_admins").select("id, active").eq("user_id", userId).maybeSingle(),
    ]);
    // Sub-admins also carry the admin role for console access — exclude them.
    if (!isAdmin || sub?.active) return null;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from(data.table)
      .select("registration_type, registered_by_name")
      .eq("id", data.id)
      .maybeSingle();

    if (!row) return null;
    return { type: row.registration_type ?? null, byName: row.registered_by_name ?? null };
  });
