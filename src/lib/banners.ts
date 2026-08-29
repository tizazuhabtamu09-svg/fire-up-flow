import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/uploads";
import type { Database } from "@/integrations/supabase/types";

export type Banner = Database["public"]["Tables"]["banners"]["Row"];

export type BannerWithUrls = Banner & {
  desktopUrl: string | null;
  mobileUrl: string | null;
};

export const BANNER_BUCKET = "banners";

export const BANNER_PLACEMENTS = [
  { value: "home_hero", label: "Home page — top banner" },
  { value: "home_mid", label: "Home page — middle strip" },
  { value: "jobs", label: "Jobs board" },
];

export function placementLabel(value: string) {
  return BANNER_PLACEMENTS.find((p) => p.value === value)?.label ?? value;
}

async function withUrls(rows: Banner[]): Promise<BannerWithUrls[]> {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      desktopUrl: row.desktop_image ? await signedUrl(BANNER_BUCKET, row.desktop_image, 3600) : null,
      mobileUrl: row.mobile_image ? await signedUrl(BANNER_BUCKET, row.mobile_image, 3600) : null,
    })),
  );
}

function isLive(row: Banner): boolean {
  const now = Date.now();
  if (row.starts_at && new Date(row.starts_at).getTime() > now) return false;
  if (row.ends_at && new Date(row.ends_at).getTime() < now) return false;
  return row.active;
}

/** Active banners for a placement, with resolved image URLs. Public — works signed out. */
export function useBanners(placement = "home_hero") {
  const [banners, setBanners] = useState<BannerWithUrls[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("placement", placement)
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      const rows = (data ?? []).filter(isLive);
      const resolved = await withUrls(rows);
      if (alive) {
        setBanners(resolved);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [placement]);

  return { banners, loading };
}

/** All banners (staff only), including inactive ones. */
export function useAllBanners() {
  const [banners, setBanners] = useState<BannerWithUrls[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("placement", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) throw error;
    setBanners(await withUrls(data ?? []));
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { banners, loading, reload };
}

export async function uploadBannerImage(file: File, variant: "desktop" | "mobile") {
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${variant}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BANNER_BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

export type BannerInput = {
  title: string | null;
  subtitle: string | null;
  body: string | null;
  cta_label: string | null;
  cta_link: string | null;
  desktop_image: string | null;
  mobile_image: string | null;
  kind: string;
  placement: string;
  active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
};

export async function createBanner(input: BannerInput, createdBy: string | null) {
  const { error } = await supabase.from("banners").insert({ ...input, created_by: createdBy });
  if (error) throw error;
}

export async function updateBanner(id: string, patch: Partial<BannerInput>) {
  const { error } = await supabase.from("banners").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteBanner(row: Banner) {
  const paths = [row.desktop_image, row.mobile_image].filter(Boolean) as string[];
  if (paths.length) await supabase.storage.from(BANNER_BUCKET).remove(paths);
  const { error } = await supabase.from("banners").delete().eq("id", row.id);
  if (error) throw error;
}
