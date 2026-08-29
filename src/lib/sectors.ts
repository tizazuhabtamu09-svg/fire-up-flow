import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CustomSector = { id: string; key: string; label: string; am: string | null; active: boolean };

let cache: CustomSector[] | null = null;
let inflight: Promise<CustomSector[]> | null = null;
const listeners = new Set<(rows: CustomSector[]) => void>();

export async function fetchCustomSectors(force = false): Promise<CustomSector[]> {
  if (!force && cache) return cache;
  if (!force && inflight) return inflight;
  inflight = (async () => {
    const { data } = await supabase
      .from("sectors")
      .select("id, key, label, am, active")
      .eq("active", true)
      .order("label");
    const rows = (data ?? []) as CustomSector[];
    cache = rows;
    inflight = null;
    for (const fn of listeners) fn(rows);
    return rows;
  })();
  return inflight;
}

/** Admin-created sectors, merged into every sector dropdown. */
export function useCustomSectors() {
  const [sectors, setSectors] = useState<CustomSector[]>(cache ?? []);

  useEffect(() => {
    let alive = true;
    listeners.add(setSectors);
    fetchCustomSectors().then((rows) => {
      if (alive) setSectors(rows);
    });
    return () => {
      alive = false;
      listeners.delete(setSectors);
    };
  }, []);

  return sectors;
}

export const sectorKeyFromLabel = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/** Admin management helpers. */
export async function listAllSectors(): Promise<CustomSector[]> {
  const { data, error } = await supabase.from("sectors").select("id, key, label, am, active").order("label");
  if (error) throw error;
  return (data ?? []) as CustomSector[];
}

export async function addSector(label: string, am: string, createdBy: string | null) {
  const key = sectorKeyFromLabel(label);
  if (!key) throw new Error("Enter a valid sector name.");
  const { error } = await supabase
    .from("sectors")
    .insert({ key, label: label.trim(), am: am.trim() || null, created_by: createdBy });
  if (error) throw error;
  await fetchCustomSectors(true);
}

export async function setSectorActive(id: string, active: boolean) {
  const { error } = await supabase.from("sectors").update({ active }).eq("id", id);
  if (error) throw error;
  await fetchCustomSectors(true);
}
