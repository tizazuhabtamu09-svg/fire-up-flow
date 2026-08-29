import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Log = Database["public"]["Tables"]["compliance_logs"]["Row"];

/** Read-only audit feed of compliance activity. */
export function ComplianceLogs() {
  const [rows, setRows] = useState<Log[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("compliance_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setRows((data ?? []) as Log[]);
        setLoading(false);
      });
  }, []);

  const q = query.trim().toLowerCase();
  const visible = q
    ? rows.filter((r) =>
        [r.action, r.actor_name, r.subject_type, r.summary].some((v) => (v ?? "").toLowerCase().includes(q)),
      )
    : rows;

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search action, person or subject…"
        className="mb-4 w-full max-w-md rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />

      {loading ? (
        <p className="text-muted-foreground">Loading audit trail…</p>
      ) : visible.length === 0 ? (
        <p className="text-muted-foreground">No compliance activity recorded yet.</p>
      ) : (
        <ol className="space-y-2">
          {visible.map((r) => (
            <li key={r.id} className="card-soft flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold capitalize">{r.action.replace(/_/g, " ")}</p>
                {r.summary && <p className="mt-0.5 break-words text-sm text-muted-foreground">{r.summary}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.actor_name ?? "System"} · {r.subject_type}
                  {r.subject_id ? ` #${r.subject_id.slice(0, 8)}` : ""}
                </p>
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
