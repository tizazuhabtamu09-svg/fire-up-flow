import { supabase } from "@/integrations/supabase/client";
import type { VerificationStatus } from "@/lib/use-session";

export type VerificationSource = "profiles" | "workers" | "broker_employers";

export type UserKind = "employee" | "employer" | "broker" | "admin" | "kyc" | "other";

export type ReviewDoc = { label: string; bucket: string; path: string };

export type ReviewItem = {
  key: string;
  id: string;
  source: VerificationSource;
  ownerId: string | null;
  name: string;
  subtitle: string;
  kind: UserKind;
  status: VerificationStatus;
  note: string | null;
  createdAt: string;
  docs: ReviewDoc[];
};

export const kindLabels: Record<UserKind, string> = {
  employee: "Employee",
  employer: "Employer",
  broker: "Broker",
  admin: "Admin",
  kyc: "KYC reviewer",
  other: "Other",
};

export function itemKey(source: VerificationSource, id: string) {
  return `${source}~${id}`;
}

export function parseItemKey(key: string): { source: VerificationSource; id: string } | null {
  const [source, id] = key.split("~");
  if (!id || !["profiles", "workers", "broker_employers"].includes(source)) return null;
  return { source: source as VerificationSource, id };
}

/** Loads every verification subject (profiles, broker-registered workers and employers). */
export async function loadReviewItems(): Promise<ReviewItem[]> {
  const [profiles, apps, workers, employers] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("applications").select("*"),
    supabase.from("workers").select("*").order("created_at", { ascending: false }),
    supabase.from("broker_employers").select("*").order("created_at", { ascending: false }),
  ]);

  const appByUser = new Map((apps.data ?? []).map((a) => [a.user_id, a]));
  const items: ReviewItem[] = [];

  for (const p of profiles.data ?? []) {
    const app = appByUser.get(p.id);
    items.push({
      key: itemKey("profiles", p.id),
      id: p.id,
      source: "profiles",
      ownerId: p.id,
      name: p.full_name || "Unnamed user",
      subtitle: [p.phone, p.city].filter(Boolean).join(" · ") || "No contact details",
      kind: (p.role as UserKind) ?? "other",
      status: p.verification_status,
      note: p.verification_note,
      createdAt: p.created_at,
      docs: [
        app?.fayda_front && { label: "Fayda front", bucket: "id-documents", path: app.fayda_front },
        app?.fayda_back && { label: "Fayda back", bucket: "id-documents", path: app.fayda_back },
        app?.personal_photo && { label: "Personal photo", bucket: "avatars", path: app.personal_photo },
      ].filter(Boolean) as ReviewDoc[],
    });
  }

  for (const w of workers.data ?? []) {
    items.push({
      key: itemKey("workers", w.id),
      id: w.id,
      source: "workers",
      ownerId: w.owner_id,
      name: w.full_name,
      subtitle: [w.phone, w.city].filter(Boolean).join(" · ") || "Registered by a broker",
      kind: "employee",
      status: w.verification_status,
      note: w.verification_note,
      createdAt: w.created_at,
      docs: [
        w.fayda_front && { label: "Fayda front", bucket: "id-documents", path: w.fayda_front },
        w.fayda_back && { label: "Fayda back", bucket: "id-documents", path: w.fayda_back },
        w.contract_path && { label: "Contract", bucket: "id-documents", path: w.contract_path },
        w.photo_url && { label: "Photo", bucket: "avatars", path: w.photo_url },
      ].filter(Boolean) as ReviewDoc[],
    });
  }

  for (const e of employers.data ?? []) {
    items.push({
      key: itemKey("broker_employers", e.id),
      id: e.id,
      source: "broker_employers",
      ownerId: e.broker_id,
      name: e.full_name,
      subtitle: [e.phone, e.city].filter(Boolean).join(" · ") || "Registered by a broker",
      kind: "employer",
      status: e.verification_status,
      note: e.verification_note,
      createdAt: e.created_at,
      docs: [
        e.fayda_front && { label: "Fayda front", bucket: "id-documents", path: e.fayda_front },
        e.fayda_back && { label: "Fayda back", bucket: "id-documents", path: e.fayda_back },
        e.personal_photo && { label: "Personal photo", bucket: "avatars", path: e.personal_photo },
      ].filter(Boolean) as ReviewDoc[],
    });
  }

  return items;
}

export async function loadReviewItem(key: string): Promise<ReviewItem | null> {
  const parsed = parseItemKey(key);
  if (!parsed) return null;
  const all = await loadReviewItems();
  return all.find((i) => i.key === key) ?? null;
}

export async function decideVerification(
  item: ReviewItem,
  status: VerificationStatus,
  note: string | null,
) {
  const patch = {
    verification_status: status,
    verified_at: status === "approved" ? new Date().toISOString() : null,
    verification_note: note,
  };
  if (item.source === "profiles") return supabase.from("profiles").update(patch).eq("id", item.id);
  if (item.source === "workers") return supabase.from("workers").update(patch).eq("id", item.id);
  return supabase.from("broker_employers").update(patch).eq("id", item.id);
}

export type ActivityEntry = { id: string; at: string; label: string; detail: string };

/** Recent activity across the platform, newest first. */
export async function loadActivity(limit = 25): Promise<ActivityEntry[]> {
  const [apps, payments, bookings, messages, workers] = await Promise.all([
    supabase.from("applications").select("id, full_name, role, created_at").order("created_at", { ascending: false }).limit(limit),
    supabase.from("payments").select("id, payer_name, amount, status, created_at").order("created_at", { ascending: false }).limit(limit),
    supabase.from("bookings").select("id, service, status, created_at").order("created_at", { ascending: false }).limit(limit),
    supabase.from("messages").select("id, subject, status, created_at").order("created_at", { ascending: false }).limit(limit),
    supabase.from("workers").select("id, full_name, verification_status, updated_at").order("updated_at", { ascending: false }).limit(limit),
  ]);

  const entries: ActivityEntry[] = [
    ...(apps.data ?? []).map((a) => ({ id: `app-${a.id}`, at: a.created_at, label: "Application submitted", detail: `${a.full_name} · ${a.role}` })),
    ...(payments.data ?? []).map((p) => ({ id: `pay-${p.id}`, at: p.created_at, label: `Payment ${p.status}`, detail: `${p.payer_name} · ${p.amount} ETB` })),
    ...(bookings.data ?? []).map((b) => ({ id: `book-${b.id}`, at: b.created_at, label: `Booking ${b.status}`, detail: b.service })),
    ...(messages.data ?? []).map((m) => ({ id: `msg-${m.id}`, at: m.created_at, label: `Message ${m.status}`, detail: m.subject || "No subject" })),
    ...(workers.data ?? []).map((w) => ({ id: `wrk-${w.id}`, at: w.updated_at, label: `Worker ${w.verification_status}`, detail: w.full_name })),
  ];

  return entries.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, limit);
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
