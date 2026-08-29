import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { openSigned } from "@/lib/uploads";
import { AdminSection, adminInput } from "@/components/admin/shared";
import { useLanguage } from "@/lib/i18n";
import type { Database } from "@/integrations/supabase/types";

type AssignmentRow = Database["public"]["Tables"]["assignments"]["Row"];
type AssignmentJoined = AssignmentRow & {
  broker_employers: { full_name: string; phone: string | null } | null;
  workers: { full_name: string; sector: string } | null;
};

export const Route = createFileRoute("/_authenticated/admin/assignments")({
  component: AdminAssignments,
});

function AdminAssignments() {
  const [rows, setRows] = useState<AssignmentJoined[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    supabase
      .from("assignments")
      .select("*, broker_employers(full_name, phone), workers(full_name, sector)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as unknown as AssignmentJoined[]));
  }, []);

  async function patch(r: AssignmentJoined, p: Partial<AssignmentRow>) {
    const { error } = await supabase.from("assignments").update(p).eq("id", r.id);
    if (!error) setRows((all) => all.map((x) => (x.id === r.id ? { ...x, ...p } : x)));
  }
  async function remove(id: string) {
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (!error) setRows((all) => all.filter((x) => x.id !== id));
  }

  return (
    <AdminSection title={t("admin.assignments.title")} description={t("admin.assignments.description")}>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="card-soft p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {r.workers?.full_name ?? t("admin.assignments.worker")} → {r.broker_employers?.full_name ?? t("admin.assignments.employer")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("admin.assignments.witness")} {r.witness_name} · {r.witness_phone}
                  {r.witness_sex ? ` · ${r.witness_sex}` : ""} · {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="rounded-full border border-input bg-background px-3 py-1.5 text-xs"
                  value={r.status}
                  onChange={(e) => patch(r, { status: e.target.value })}
                >
                  {["active", "completed", "cancelled"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {r.agreement_path && (
                  <button onClick={() => openSigned("id-documents", r.agreement_path!)} className="btn-outline-brand text-xs">
                    {t("admin.assignments.agreement")}
                  </button>
                )}
                <button onClick={() => remove(r.id)} className="text-xs font-semibold text-destructive hover:underline">{t("admin.assignments.delete")}</button>
              </div>
            </div>
            <input
              className={`${adminInput} mt-3`}
              defaultValue={r.admin_note ?? ""}
              placeholder={t("admin.assignments.notePlaceholder")}
              onBlur={(e) => patch(r, { admin_note: e.target.value || null })}
            />
          </div>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground">{t("admin.assignments.empty")}</p>}
      </div>
    </AdminSection>
  );
}
