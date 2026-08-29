import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FeedbackChat } from "@/components/backoffice/FeedbackChat";
import type { TerminationRequest } from "@/lib/employees";

const FILTERS = ["pending", "approved", "declined", "all"] as const;

/** Admin / KYC review queue for employer-filed termination requests. */
export function TerminationRequests({ viewerId }: { viewerId: string | null }) {
  const [rows, setRows] = useState<TerminationRequest[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("termination_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as TerminationRequest[]);
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
            {f}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground">No {filter === "all" ? "" : filter} termination requests.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <TerminationCard
              key={r.id}
              row={r}
              viewerId={viewerId}
              open={openId === r.id}
              onToggle={() => setOpenId(openId === r.id ? null : r.id)}
              onReviewed={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TerminationCard({
  row,
  viewerId,
  open,
  onToggle,
  onReviewed,
}: {
  row: TerminationRequest;
  viewerId: string | null;
  open: boolean;
  onToggle: () => void;
  onReviewed: () => void;
}) {
  const [note, setNote] = useState("");
  const [makeAvailable, setMakeAvailable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function review(approve: boolean) {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.rpc("review_termination", {
      _id: row.id,
      _approve: approve,
      _note: note.trim(),
      _make_available: approve ? makeAvailable : false,
    });
    setBusy(false);
    if (err) return setError(err.message);
    onReviewed();
  }

  const tone =
    row.status === "pending"
      ? "bg-amber-100 text-amber-800"
      : row.status === "approved"
        ? "bg-emerald-100 text-emerald-800"
        : "bg-rose-100 text-rose-800";

  return (
    <div className="card-soft p-5">
      <button onClick={onToggle} className="flex w-full flex-wrap items-center justify-between gap-3 text-left">
        <div>
          <p className="font-semibold">{row.worker_name}</p>
          <p className="text-sm text-muted-foreground">
            {row.reason} · filed {new Date(row.created_at).toLocaleDateString()}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${tone}`}>{row.status}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4 rounded-2xl bg-secondary/50 p-4">
          {row.details && <p className="text-sm">{row.details}</p>}

          {row.status === "pending" ? (
            <div className="space-y-3">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Decision note for the employer (optional)"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <div className="space-y-2">
                <p className="text-sm font-medium">On approval, set {row.worker_name} to:</p>
                <div className="flex gap-2">
                  {[
                    { value: true, label: "Available for future placement" },
                    { value: false, label: "Unavailable" },
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setMakeAvailable(opt.value)}
                      className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${
                        makeAvailable === opt.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex flex-wrap gap-2">
                <button disabled={busy} onClick={() => review(true)} className="btn-brand text-xs disabled:opacity-60">
                  Approve termination
                </button>
                <button
                  disabled={busy}
                  onClick={() => review(false)}
                  className="rounded-full border border-destructive px-4 py-2 text-xs font-semibold text-destructive disabled:opacity-60"
                >
                  Decline
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {row.admin_note && <p className="text-foreground">Note: {row.admin_note}</p>}
              <p>
                Reviewed {row.reviewed_at ? new Date(row.reviewed_at).toLocaleString() : ""} ·{" "}
                {row.status === "approved"
                  ? `worker marked ${row.make_available ? "available" : "unavailable"}`
                  : "no change to the placement"}
              </p>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Conversation with the employer
            </p>
            <FeedbackChat
              ownerId={row.employer_id}
              source="termination"
              subjectId={row.id}
              name={row.worker_name}
              viewerId={viewerId}
              asStaff
            />
          </div>
        </div>
      )}
    </div>
  );
}
