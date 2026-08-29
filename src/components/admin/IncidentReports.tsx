import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminInput } from "@/components/admin/shared";
import { COMPLIANCE_EMAIL } from "@/lib/app-config";
import { buildAuthorityEmail, reportTitle, type IncidentReport } from "@/lib/requests";

/** Incoming compliance logs: inspect incidents, reply to the employer, escalate to the authorities. */
export function IncidentReports() {
  const [rows, setRows] = useState<IncidentReport[]>([]);
  const [filter, setFilter] = useState<string>("open");

  useEffect(() => {
    supabase
      .from("incident_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as IncidentReport[]));
  }, []);

  async function patch(row: IncidentReport, p: Partial<IncidentReport>) {
    const { error } = await supabase.from("incident_reports").update(p).eq("id", row.id);
    if (!error) setRows((r) => r.map((x) => (x.id === row.id ? { ...x, ...p } : x)));
  }

  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {["open", "resolved", "all"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === s ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map((r) => <ReportCard key={r.id} row={r} patch={patch} />)}
        {visible.length === 0 && <p className="text-muted-foreground">No compliance logs in this queue.</p>}
      </div>
    </div>
  );
}

function ReportCard({
  row,
  patch,
}: {
  row: IncidentReport;
  patch: (row: IncidentReport, p: Partial<IncidentReport>) => Promise<void>;
}) {
  const details = (row.details ?? {}) as Record<string, string>;
  const [reply, setReply] = useState(row.admin_response ?? "");
  const [links, setLinks] = useState<{ path: string; url: string }[]>([]);

  useEffect(() => {
    const attachments = (row.attachments ?? []) as string[];
    if (attachments.length === 0) return;
    (async () => {
      const signed = await Promise.all(
        attachments.map(async (path: string) => {
          const { data } = await supabase.storage.from("incident-evidence").createSignedUrl(path, 600);
          return { path, url: data?.signedUrl ?? "" };
        }),
      );
      setLinks(signed.filter((s: { path: string; url: string }) => s.url));
    })();
  }, [row.attachments]);

  async function forwardToAuthorities() {
    const body = buildAuthorityEmail(row, row.employer_id);
    const subject = `Incident notification ${row.id.slice(0, 8)} — ${reportTitle(row.category)}`;
    window.location.href = `mailto:${COMPLIANCE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    await patch(row, { forwarded_at: new Date().toISOString() });
  }

  return (
    <div className="card-soft p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{row.worker_name}</p>
          <p className="text-sm text-muted-foreground">
            {reportTitle(row.category)} · filed {new Date(row.created_at).toLocaleString()}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            row.category === "security" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {row.status}
        </span>
      </div>

      <dl className="mt-3 grid gap-2 rounded-xl bg-secondary/50 p-3 text-sm sm:grid-cols-2">
        {Object.entries(details).map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k.replaceAll("_", " ")}</dt>
            <dd className="whitespace-pre-wrap">{String(v)}</dd>
          </div>
        ))}
      </dl>

      {links.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {links.map((l, i) => (
            <a key={l.path} href={l.url} target="_blank" rel="noreferrer" className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
              Evidence {i + 1}
            </a>
          ))}
        </div>
      )}

      <textarea
        className={`${adminInput} mt-3 min-h-20`}
        value={reply}
        placeholder="Formal response to the filing employer…"
        onChange={(e) => setReply(e.target.value)}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => patch(row, { admin_response: reply || null })} className="btn-brand text-xs">Send response</button>
        <button
          onClick={() => patch(row, { status: row.status === "open" ? "resolved" : "open" })}
          className="btn-outline-brand text-xs"
        >
          {row.status === "open" ? "Mark resolved" : "Reopen"}
        </button>
        {row.category === "security" && (
          <button onClick={forwardToAuthorities} className="btn-outline-brand text-xs">
            Forward to official authorities
          </button>
        )}
      </div>

      {row.forwarded_at && (
        <p className="mt-2 text-xs text-muted-foreground">
          Forwarded to the authorities on {new Date(row.forwarded_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
