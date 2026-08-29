import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminSection } from "@/components/admin/shared";
import { useLanguage } from "@/lib/i18n";
import type { Database } from "@/integrations/supabase/types";

type SubAdmin = Database["public"]["Tables"]["sub_admins"]["Row"];

export const Route = createFileRoute("/_authenticated/admin/sub-admins")({
  component: AdminSubAdmins,
});

function AdminSubAdmins() {
  const [rows, setRows] = useState<SubAdmin[]>([]);
  const { t } = useLanguage();

  const PERMISSIONS = [
    { key: "users", label: t("admin.subAdmins.permUsers") },
    { key: "verification", label: t("admin.subAdmins.permVerification") },
    { key: "pricing", label: t("admin.subAdmins.permPricing") },
    { key: "payments", label: t("admin.subAdmins.permPayments") },
    { key: "bookings", label: t("admin.subAdmins.permBookings") },
  ];

  useEffect(() => {
    supabase.from("sub_admins").select("*").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  }, []);

  async function patch(row: SubAdmin, p: Partial<SubAdmin>) {
    const { error } = await supabase.from("sub_admins").update(p).eq("id", row.id);
    if (!error) setRows((r) => r.map((x) => (x.id === row.id ? { ...x, ...p } : x)));
  }

  async function remove(id: string) {
    const { error } = await supabase.from("sub_admins").delete().eq("id", id);
    if (!error) setRows((r) => r.filter((x) => x.id !== id));
  }

  return (
    <AdminSection title={t("admin.subAdmins.title")} description={t("admin.subAdmins.description")}>
      <Link to="/admin/accounts" className="btn-brand text-sm">{t("admin.subAdmins.create")}</Link>

      <div className="mt-6 space-y-3">
        {rows.map((row) => {
          const perms = (row.permissions ?? {}) as Record<string, boolean>;
          return (
            <div key={row.id} className="card-soft p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{row.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {row.email}{row.phone ? ` · ${row.phone}` : ""}{row.city ? ` · ${row.city}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => patch(row, { active: !row.active })} className="btn-outline-brand text-xs">
                    {row.active ? t("admin.subAdmins.active") : t("admin.subAdmins.disabled")}
                  </button>
                  <button onClick={() => remove(row.id)} className="text-xs font-semibold text-destructive hover:underline">{t("admin.subAdmins.delete")}</button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {PERMISSIONS.map((p) => (
                  <label key={p.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(perms[p.key])}
                      onChange={(e) => patch(row, { permissions: { ...perms, [p.key]: e.target.checked } })}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <p className="text-muted-foreground">{t("admin.subAdmins.empty")}</p>}
      </div>
    </AdminSection>
  );
}
