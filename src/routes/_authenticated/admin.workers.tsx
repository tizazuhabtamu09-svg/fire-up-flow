import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money, sectorLabel } from "@/lib/app-config";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { AdminSection } from "@/components/admin/shared";
import { RegistrationOrigin } from "@/components/admin/RegistrationOrigin";
import { useSession, useRoleFlags } from "@/lib/use-session";
import { resolveAvatars } from "@/lib/employees";
import { EmployeeAvatar } from "@/components/EmployeeAvatar";
import { useLanguage } from "@/lib/i18n";
import type { Database } from "@/integrations/supabase/types";

type WorkerRow = Database["public"]["Tables"]["workers"]["Row"];

export const Route = createFileRoute("/_authenticated/admin/workers")({
  component: AdminWorkers,
});

function AdminWorkers() {
  const { user } = useSession();
  const { isAdmin } = useRoleFlags(user?.id);
  const [rows, setRows] = useState<WorkerRow[]>([]);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const { t } = useLanguage();

  useEffect(() => {
    supabase
      .from("workers")
      .select("*")
      .order("created_at", { ascending: false })
      .then(async ({ data }) => {
        const list = data ?? [];
        setRows(list);
        setPhotos(await resolveAvatars(list.map((w) => w.photo_url)));
      });
  }, []);

  async function patch(w: WorkerRow, p: Partial<WorkerRow>) {
    const { error } = await supabase.from("workers").update(p).eq("id", w.id);
    if (!error) setRows((r) => r.map((x) => (x.id === w.id ? { ...x, ...p } : x)));
  }
  async function remove(id: string) {
    const { error } = await supabase.from("workers").delete().eq("id", id);
    if (!error) setRows((r) => r.filter((x) => x.id !== id));
  }

  return (
    <AdminSection title={t("admin.workers.title")} description={t("admin.workers.description")}>
      <div className="space-y-3">
        {rows.map((w) => (
          <div key={w.id} className="card-soft flex flex-wrap items-center justify-between gap-3 p-5">
            <Link to="/employee/$id" params={{ id: w.id }} className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80">
              <EmployeeAvatar photoUrl={photos[w.photo_url ?? ""] ?? null} name={w.full_name} />
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {w.full_name} <VerifiedBadge status={w.verification_status} />
                  <RegistrationOrigin isAdmin={isAdmin} type={w.registration_type} byName={w.registered_by_name} />
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {sectorLabel(w.sector, w.sector_other)}{w.phone ? ` · ${w.phone}` : ""}{w.area ? ` · ${w.area}` : ""}
                  {w.price ? ` · ${t("admin.workers.perMonth", { amount: money(w.price) })}` : ""}
                </p>
              </div>
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                defaultValue={w.price ?? ""}
                onBlur={(e) => patch(w, { price: e.target.value ? Number(e.target.value) : null })}
                className="w-28 rounded-full border border-input bg-background px-3 py-1.5 text-xs"
                placeholder={t("admin.workers.pricePlaceholder")}
              />
              <button onClick={() => patch(w, { available: !w.available })} className="btn-outline-brand text-xs">
                {w.available ? t("admin.workers.available") : t("admin.workers.notAvailable")}
              </button>
              <button onClick={() => remove(w.id)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-destructive hover:underline">{t("admin.workers.delete")}</button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground">{t("admin.workers.empty")}</p>}
      </div>
    </AdminSection>
  );
}
