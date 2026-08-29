import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminInput } from "@/components/admin/shared";
import type { Database } from "@/integrations/supabase/types";

type Report = Database["public"]["Tables"]["employer_reports"]["Row"];

const FILTERS = ["pending", "under_review", "resolved", "dismissed", "all"] as const;

/** Back-office queue for reports employees file against their employer. */
export function EmployeeReports() {
  const [rows, setRows] = useState<Report[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("employer_reports")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Report[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground">No employee reports in this queue.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <ReportCard key={r.id} row={r} onSaved={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ row, onSaved }: { row: Report; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [response, setResponse] = useState(row.admin_response ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<{ name: string; url: string }[]>([]);

  useEffect(() => {
    const attachments = (row.attachments ?? []) as { path: string; name?: string }[];
    if (!open || attachments.length === 0) return;
    (async () => {
      const signed = await Promise.all(
        attachments.map(async (a) => {
          const { data } = await supabase.storage.from("report-evidence").createSignedUrl(a.path, 600);
          return { name: a.name ?? a.path.split("/").pop() ?? "Attachment", url: data?.signedUrl ?? "" };
        }),
      );
      setLinks(signed.filter((s) => s.url));
    })();
  }, [open, row.attachments]);

  async function decide(status: string) {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase
      .from("employer_reports")
      .update({
        status,
        admin_response: response.trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    setBusy(false);
    if (err) return setError(err.message);
    onSaved();
  }

  const tone =
    row.status === "pending" || row.status === "under_review"
      ? "bg-amber-100 text-amber-800"
      : row.status === "resolved"
        ? "bg-emerald-100 text-emerald-800"
        : "bg-rose-100 text-rose-800";

  return (
    <div className="card-soft p-5">
      <button onClick={() => setOpen(!open)} className="flex w-full flex-wrap items-center justify-between gap-3 text-left">
        <div>
          <p className="font-semibold">Reported employer: {row.employer_name}</p>
          <p className="text-sm text-muted-foreground">
            {row.reason} · filed {new Date(row.created_at).toLocaleString()}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${tone}`}>
          {row.status.replace("_", " ")}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4 rounded-2xl bg-secondary/50 p-4">
          {row.details && <p className="text-sm">{row.details}</p>}

          {links.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Evidence</p>
              <div className="flex flex-wrap gap-2">
                {links.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-card px-3 py-1.5 text-xs font-semibold underline"
                  >
                    {l.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          <textarea
            rows={3}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Response to the employee (optional)"
            className={adminInput}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => decide("under_review")} className="btn-outline-brand text-xs disabled:opacity-60">
              Mark under review
            </button>
            <button disabled={busy} onClick={() => decide("resolved")} className="btn-brand text-xs disabled:opacity-60">
              Resolve
            </button>
            <button
              disabled={busy}
              onClick={() => decide("dismissed")}
              className="rounded-full border border-destructive px-4 py-2 text-xs font-semibold text-destructive disabled:opacity-60"
            >
              Dismiss
            </button>
          </div>
          {row.reviewed_at && (
            <p className="text-xs text-muted-foreground">
              Last reviewed {new Date(row.reviewed_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
