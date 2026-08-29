import { createServerFn } from "@tanstack/react-start";
import { requireAuth as requireSupabaseAuth } from "@/lib/auth-guard";

/** Editable onboarding/registration fields on a worker record. */
export type EditableWorkerFields = {
  full_name: string;
  phone: string | null;
  email: string | null;
  gender: "male" | "female" | "other" | null;
  age: number | null;
  sector: string;
  sector_other: string | null;
  experience: string | null;
  price: number | null;
  city: string | null;
  sub_city: string | null;
  wereda: string | null;
  kebele: string | null;
  area: string | null;
  address: string | null;
  fayda_number: string | null;
  guarantor_name: string | null;
  guarantor_phone: string | null;
  guarantor_id_number: string | null;
  language: string | null;
  language_other: string | null;
  skills: string[];
  available: boolean;
  photo_url: string | null;
};

const TEXT_FIELDS = [
  "phone", "email", "sector_other", "experience", "city", "sub_city", "wereda",
  "kebele", "area", "address", "fayda_number", "guarantor_name", "guarantor_phone",
  "guarantor_id_number", "language", "language_other",
] as const;

function forbidden(): never {
  throw new Response("Forbidden", { status: 403 });
}

/** Admins only. Any other caller (including unauthenticated) gets 403. */
async function assertAdmin(context: { supabase: { rpc: Function }; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) forbidden();
}

function clean(value: unknown, max = 200): string | null {
  const text = String(value ?? "").trim().slice(0, max);
  return text ? text : null;
}

/**
 * Admin edit of another user's registration record. RBAC is enforced here, on
 * the server, so the endpoint is safe even when called directly.
 */
export const adminUpdateWorkerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { workerId: string; values: Partial<EditableWorkerFields> }) => {
    const workerId = String(input?.workerId ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(workerId)) throw new Error("Invalid profile reference.");
    const raw = input?.values ?? {};
    const values: Record<string, unknown> = {};

    if (raw.full_name !== undefined) {
      const name = clean(raw.full_name, 120);
      if (!name) throw new Error("Full name is required.");
      values["full_name"] = name;
    }
    if (raw.sector !== undefined) {
      const sector = clean(raw.sector, 60);
      if (!sector) throw new Error("Sector is required.");
      values["sector"] = sector;
    }
    for (const key of TEXT_FIELDS) {
      if (raw[key] !== undefined) values[key] = clean(raw[key]);
    }
    if (raw.gender !== undefined) {
      values["gender"] = raw.gender && ["male", "female", "other"].includes(raw.gender) ? raw.gender : null;
    }
    if (raw.age !== undefined) {
      const age = Number(raw.age);
      values["age"] = Number.isFinite(age) && age > 0 ? Math.min(Math.round(age), 120) : null;
    }
    if (raw.price !== undefined) {
      const price = Number(raw.price);
      values["price"] = Number.isFinite(price) && price >= 0 ? price : null;
    }
    if (raw.skills !== undefined) {
      const list = Array.isArray(raw.skills) ? raw.skills : [];
      values["skills"] = Array.from(
        new Set(list.map((s) => String(s ?? "").trim().slice(0, 60)).filter(Boolean)),
      ).slice(0, 30);
    }
    if (raw.available !== undefined) values["available"] = Boolean(raw.available);
    if (raw.photo_url !== undefined) values["photo_url"] = clean(raw.photo_url, 400);

    return { workerId, values };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("workers")
      .update({ ...data.values, updated_at: new Date().toISOString() })
      .eq("id", data.workerId)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Profile not found.");

    // Keep the linked account profile in step with the registration record.
    if (row.user_id) {
      const sync: {
        full_name?: string | null;
        phone?: string | null;
        city?: string | null;
        avatar_url?: string | null;
      } = {};
      if (data.values["full_name"] !== undefined) sync.full_name = data.values["full_name"] as string;
      if (data.values["phone"] !== undefined) sync.phone = data.values["phone"] as string | null;
      if (data.values["city"] !== undefined) sync.city = data.values["city"] as string | null;
      // A new registration photo is also the account avatar.
      if (data.values["photo_url"] !== undefined) sync.avatar_url = data.values["photo_url"] as string | null;
      if (Object.keys(sync).length) {
        await supabaseAdmin.from("profiles").update(sync).eq("id", row.user_id);
      }
    }

    return { worker: row };
  });
