import { useLanguage } from "@/lib/i18n";import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { money, sectorLabel } from "@/lib/app-config";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import type { Database } from "@/integrations/supabase/types";

type WorkerRow = Database["public"]["Tables"]["workers"]["Row"] & {global_status: string;};

type RosterStatus = "available" | "assigned" | "unavailable";

const TABS: {value: RosterStatus;label: string;hint: string;}[] = [
{ value: "available", label: "Available employees", hint: "Visible in the public directory." },
{ value: "assigned", label: "Assigned employees", hint: "Linked to an active request or contract — hidden from the public directory." },
{ value: "unavailable", label: "Unavailable employees", hint: "Paused, offboarded or recently terminated profiles." }];


type Link_ = {workerRef: string;employerId: string;status: string;kind: "request" | "contract";};

/** Admin roster: three-state candidate management (available / assigned / unavailable). */
export function CandidateRoster() {const { t } = useLanguage();
  const [tab, setTab] = useState<RosterStatus>("available");
  const [rows, setRows] = useState<WorkerRow[]>([]);
  const [links, setLinks] = useState<Link_[]>([]);
  const [employers, setEmployers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data: workers }, { data: requests }, { data: hires }] = await Promise.all([
    supabase.from("workers").select("*").order("created_at", { ascending: false }),
    supabase.from("employee_requests").select("assigned_worker_id, employee_ref, employer_id, status").neq("status", "DECLINED"),
    supabase.from("hired_employees").select("worker_ref, employer_id, status").neq("status", "terminated")]
    );

    setRows((workers ?? []) as WorkerRow[]);

    const collected: Link_[] = [];
    for (const r of requests ?? []) {
      const ref = r.assigned_worker_id ?? r.employee_ref;
      if (ref) collected.push({ workerRef: ref, employerId: r.employer_id, status: r.status, kind: "request" });
    }
    for (const h of hires ?? []) {
      if (h.worker_ref) collected.push({ workerRef: h.worker_ref, employerId: h.employer_id, status: h.status, kind: "contract" });
    }
    setLinks(collected);

    const ids = Array.from(new Set(collected.map((l) => l.employerId))).filter(Boolean);
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setEmployers(Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name ?? "Employer"])));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(worker: WorkerRow, status: RosterStatus) {
    setBusy(worker.id);
    setError(null);
    const { error: err } = await supabase.rpc("set_worker_roster_status", { _worker_id: worker.id, _status: status });
    setBusy(null);
    if (err) return setError(err.message);
    setRows((r) => r.map((x) => x.id === worker.id ? { ...x, global_status: status, available: status === "available" } : x));
  }

  const byTab = useMemo(() => rows.filter((r) => (r.global_status ?? "available") === tab), [rows, tab]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { available: 0, assigned: 0, unavailable: 0 };
    for (const r of rows) c[r.global_status ?? "available"] = (c[r.global_status ?? "available"] ?? 0) + 1;
    return c;
  }, [rows]);

  const active = TABS.find((t) => t.value === tab)!;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) =>
        <button
          key={t.value}
          onClick={() => setTab(t.value)}
          className={`rounded-full px-4 py-2 text-xs font-semibold ${
          tab === t.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`
          }>
          
            {t.label} ({counts[t.value] ?? 0})
          </button>
        )}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{active.hint}</p>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-5 space-y-3">
        {byTab.map((w) => {
          const worker_links = links.filter((l) => l.workerRef === w.id);
          return (
            <div key={w.id} className="card-soft p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {w.full_name} <VerifiedBadge status={w.verification_status} />
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {sectorLabel(w.sector, w.sector_other)}
                    {w.city ? ` · ${w.city}` : ""}
                    {w.price ? ` · ${money(Number(w.price))}/month` : ""}
                  </p>
                  {tab === "assigned" &&
                  <p className="mt-1 text-sm">
                      {worker_links.length === 0 ?
                    "Assigned" :
                    worker_links.
                    map((l) => `${employers[l.employerId] ?? "Employer"} · ${l.kind === "contract" ? "contract" : "request"} (${l.status.replaceAll("_", " ").toLowerCase()})`).
                    join(" — ")}
                    </p>
                  }
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {tab === "available" &&
                  <button
                    disabled={busy === w.id}
                    onClick={() => setStatus(w, "unavailable")}
                    className="btn-outline-brand text-xs">{t("ui.set.unavailable")}


                  </button>
                  }
                  {tab === "unavailable" &&
                  <button
                    disabled={busy === w.id}
                    onClick={() => setStatus(w, "available")}
                    className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">{t("ui.make.available.for.public.listing")}


                  </button>
                  }
                  <Link to="/admin/workers" className="rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold">{t("ui.edit.details")}

                  </Link>
                  <Link
                    to="/employee/$id"
                    params={{ id: w.id }}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-primary hover:underline">{t("ui.view.profile")}


                  </Link>
                </div>
              </div>

              {tab !== "assigned" && worker_links.length > 0 &&
              <p className="mt-3 text-xs text-muted-foreground">{t("ui.history")}
                {worker_links.length}{t("ui.open.record")}{worker_links.length === 1 ? "" : "s"}
                </p>
              }
            </div>);

        })}
        {byTab.length === 0 && <p className="text-muted-foreground">{t("ui.no.candidates.in.this.list")}</p>}
      </div>
    </div>);

}
