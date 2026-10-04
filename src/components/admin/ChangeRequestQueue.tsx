import { useLanguage } from "@/lib/i18n";import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  changeStatusLabel,
  fieldLabel,
  isUnderReview,
  loadAllChangeRequests,
  reviewChangeRequest,
  type ChangeRequest,
  type ChangeTarget } from
"@/lib/change-requests";

type Current = Record<string, Record<string, unknown>>;

/**
 * Document-update requests submitted by brokers. They stay "Under Document
 * Review" until an admin or KYC reviewer approves (values are applied to the
 * live profile) or rejects (the existing profile is kept unchanged).
 */
export function ChangeRequestQueue() {const { t } = useLanguage();
  const [rows, setRows] = useState<ChangeRequest[]>([]);
  const [current, setCurrent] = useState<Current>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    const list = await loadAllChangeRequests();
    setRows(list);
    setLoading(false);

    const byTable = new Map<string, string[]>();
    for (const r of list) {
      const ids = byTable.get(r.target_table) ?? [];
      ids.push(r.target_id);
      byTable.set(r.target_table, ids);
    }
    const next: Current = {};
    await Promise.all(
      [...byTable].map(async ([table, ids]) => {
        const { data } = await supabase.
        from(table as "workers" | "broker_employers").
        select("*").
        in("id", ids);
        for (const row of data ?? []) next[`${table}:${(row as {id: string;}).id}`] = row as Record<string, unknown>;
      })
    );
    setCurrent(next);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(r: ChangeRequest, approve: boolean) {
    setBusy(r.id);
    setError(null);
    try {
      await reviewChangeRequest(r.id, approve, notes[r.id]?.trim() ?? "");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  const visible = showAll ? rows : rows.filter((r) => isUnderReview(r.status));
  const openCount = rows.filter((r) => isUnderReview(r.status)).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{t("ui.document.update.requests")}</h3>
          <p className="text-sm text-muted-foreground">
            {openCount}{t("ui.request")}{openCount === 1 ? "" : "s"}{t("ui.under.document.review.approving.applies.the.new.values")}

          </p>
        </div>
        <button onClick={() => setShowAll((s) => !s)} className="btn-outline-brand text-xs">
          {showAll ? "Show open only" : "Show all requests"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {loading ?
      <p className="mt-5 text-muted-foreground">{t("ui.loading")}</p> :
      visible.length === 0 ?
      <p className="mt-5 text-muted-foreground">{t("ui.no")}{showAll ? "" : "open "}{t("ui.document.update.requests.2")}</p> :

      <div className="mt-5 space-y-4">
          {visible.map((r) => {
          const target = r.target_table as ChangeTarget;
          const row = current[`${r.target_table}:${r.target_id}`] ?? {};
          const changes = (r.changes ?? {}) as Record<string, unknown>;
          const open = isUnderReview(r.status);
          return (
            <div key={r.id} className="card-soft p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{r.target_name ?? "Unnamed record"}</p>
                    <p className="text-xs text-muted-foreground">
                      {target === "workers" ? "Employee" : "Employer"}{t("ui.requested.by")}{" "}
                      {r.requester_name ?? r.requested_by} · {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  open ?
                  "bg-amber-100 text-amber-800" :
                  r.status === "approved" ?
                  "bg-emerald-100 text-emerald-800" :
                  "bg-muted text-muted-foreground"}`
                  }>
                  
                    {changeStatusLabel(r.status)}
                  </span>
                </div>

                {r.note && <p className="mt-3 text-sm">{t("ui.reason.2")}{r.note}</p>}

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[32rem] text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                        <th className="py-1 pr-4 font-semibold">{t("ui.field")}</th>
                        <th className="py-1 pr-4 font-semibold">{t("ui.current")}</th>
                        <th className="py-1 font-semibold">{t("ui.requested")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(changes).map(([key, value]) =>
                    <tr key={key} className="border-t border-border">
                          <td className="py-2 pr-4 font-medium">{fieldLabel(target, key)}</td>
                          <td className="py-2 pr-4 text-muted-foreground line-through">
                            {row[key] == null || row[key] === "" ? "—" : String(row[key])}
                          </td>
                          <td className="py-2 font-semibold">{value == null || value === "" ? "—" : String(value)}</td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>

                {open ?
              <div className="mt-4 flex flex-wrap items-center gap-3">
                    <input
                  value={notes[r.id] ?? ""}
                  onChange={(e) => setNotes((s) => ({ ...s, [r.id]: e.target.value }))}
                  placeholder={t("ui.reviewer.note.optional")}
                  className="min-w-[12rem] flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                
                    <button
                  onClick={() => review(r, true)}
                  disabled={busy === r.id}
                  className="btn-brand text-xs disabled:opacity-60">
                  
                      {busy === r.id ? "Working…" : "Approve & apply"}
                    </button>
                    <button
                  onClick={() => review(r, false)}
                  disabled={busy === r.id}
                  className="rounded-full border border-destructive px-4 py-2 text-xs font-semibold text-destructive disabled:opacity-60">{t("ui.reject")}


                </button>
                  </div> :

              <p className="mt-3 text-xs text-muted-foreground">{t("ui.reviewed")}
                {r.reviewed_at ? ` on ${new Date(r.reviewed_at).toLocaleString()}` : ""}
                    {r.admin_note ? ` · ${r.admin_note}` : ""}
                  </p>
              }
              </div>);

        })}
        </div>
      }
    </div>);

}
