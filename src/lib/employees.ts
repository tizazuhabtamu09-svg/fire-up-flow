import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sectorLabel } from "@/lib/app-config";
import { signAvatars } from "@/lib/avatars.functions";
import type { Database } from "@/integrations/supabase/types";

export type EmployeeCard = {
  id: string;
  name: string;
  role: string;
  sector: string;
  sectors: string[];
  city: string;
  area: string;
  rate: number;
  years: number;
  experience: string | null;
  gender: string | null;
  age: number | null;
  available: boolean;
  photoUrl: string | null;
  faydaVerified: boolean;
  guarantorVerified: boolean;
};

export function yearsFromExperience(text: string | null): number {
  const match = (text ?? "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

/** Resolves private avatar storage paths into short-lived signed URLs. */
export async function resolveAvatars(paths: (string | null | undefined)[]) {
  const clean = Array.from(new Set(paths.filter((p): p is string => Boolean(p)))).slice(0, 60);
  if (clean.length === 0) return {} as Record<string, string>;
  try {
    return await signAvatars({ data: { paths: clean } });
  } catch {
    return {} as Record<string, string>;
  }
}

type PublicRow = {
  id: string | null;
  full_name: string | null;
  sector: string | null;
  sector_other?: string | null;
  sectors?: string[] | null;
  city: string | null;
  area: string | null;
  experience: string | null;
  gender: string | null;
  age: number | null;
  price: number | null;
  photo_url: string | null;
  available: boolean | null;
  fayda_verified?: boolean | null;
  guarantor_verified?: boolean | null;
};

export function toEmployeeCard(row: PublicRow, signed: Record<string, string>): EmployeeCard {
  return {
    id: row.id ?? "",
    name: row.full_name ?? "Worker",
    role: sectorLabel(row.sector ?? "", row.sector_other ?? null),
    sector: row.sector ?? "other",
    sectors: (row.sectors ?? []).filter(Boolean),
    city: row.city ?? "Addis Ababa",
    area: row.area ?? "",
    rate: Number(row.price ?? 0),
    years: yearsFromExperience(row.experience),
    experience: row.experience,
    gender: row.gender,
    age: row.age,
    available: Boolean(row.available),
    photoUrl: row.photo_url ? (signed[row.photo_url] ?? null) : null,
    faydaVerified: Boolean(row.fayda_verified),
    guarantorVerified: Boolean(row.guarantor_verified),
  };
}

/**
 * Every approved employee, visible to all users in public listings.
 */
export async function loadAvailableEmployees(limit?: number): Promise<EmployeeCard[]> {
  let query = supabase
    .from("workers_public")
    .select("*")
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);

  const { data } = await query;
  const rows = (data ?? []) as PublicRow[];
  const signed = await resolveAvatars(rows.map((r) => r.photo_url));
  return rows.map((r) => toEmployeeCard(r, signed));
}

/**
 * Public directory listing that stays in step with the database: it re-reads
 * whenever a worker record changes (availability toggles, approvals, photo
 * updates) and when the tab regains focus, so unavailable workers disappear
 * without a manual refresh.
 */
export function useAvailableEmployees(limit?: number) {
  const [workers, setWorkers] = useState<EmployeeCard[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await loadAvailableEmployees(limit);
    setWorkers(list);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    let alive = true;
    const run = () => {
      if (alive) void refresh();
    };
    run();

    const channel = supabase
      .channel(`public-workers-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "worker_public_profiles" }, run)
      .on("postgres_changes", { event: "*", schema: "public", table: "workers" }, run)
      .subscribe();

    const onFocus = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);

    return () => {
      alive = false;
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  return { workers, loading, refresh };
}

/* ------------------------------------------------------------------ */
/* Unified audit & activity log                                        */
/* ------------------------------------------------------------------ */

export type WorkerRating = Database["public"]["Tables"]["worker_ratings"]["Row"];
export type IncidentRow = Database["public"]["Tables"]["incident_reports"]["Row"];
export type TerminationRequest = Database["public"]["Tables"]["termination_requests"]["Row"];

export type WorkerHistory = {
  ratings: WorkerRating[];
  incidents: IncidentRow[];
  terminations: TerminationRequest[];
};

/**
 * Full historical record for one placed worker: ratings, incident reports with
 * their official replies and termination requests. RLS keeps employers scoped
 * to their own records while staff see everything.
 */
export async function loadWorkerHistory(input: {
  workerRef: string | null;
  hiredId: string | null;
  workerName: string;
}): Promise<WorkerHistory> {
  const key = <T,>(q: T & { eq: (c: string, v: string) => T }) =>
    input.workerRef ? q.eq("worker_ref", input.workerRef) : q.eq("worker_name", input.workerName);

  const [ratings, incidents, terminations] = await Promise.all([
    key(supabase.from("worker_ratings").select("*")).order("created_at", { ascending: false }),
    key(supabase.from("incident_reports").select("*")).order("created_at", { ascending: false }),
    key(supabase.from("termination_requests").select("*")).order("created_at", { ascending: false }),
  ]);

  return {
    ratings: (ratings.data ?? []) as WorkerRating[],
    incidents: (incidents.data ?? []) as IncidentRow[],
    terminations: (terminations.data ?? []) as TerminationRequest[],
  };
}

export const TERMINATION_REASONS = [
  "Contract over",
  "Disagreement with employee",
  "Performance concerns",
  "Relocation / no longer needed",
  "Misconduct",
  "Other",
];

export const ORIGIN_LABEL: Record<string, string> = {
  broker: "Broker-registered",
  admin: "Admin-registered",
  sub_admin: "Sub-admin-registered",
  kyc: "KYC-registered",
  self: "Self-registered",
};
