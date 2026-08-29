import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TERMINATION_REASONS } from "@/lib/employees";
import type { HiredEmployee } from "@/lib/requests";

/** Employer-side termination request: reason + optional context, sent to the back office. */
export function TerminateModal({
  hire,
  employerId,
  onClose,
  onSent,
}: {
  hire: HiredEmployee;
  employerId: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [reason, setReason] = useState(TERMINATION_REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.from("termination_requests").insert({
      employer_id: employerId,
      hired_id: hire.id,
      worker_ref: hire.worker_ref,
      worker_name: hire.worker_name,
      reason,
      details: details.trim() || null,
    });
    setBusy(false);
    if (err) return setError(err.message);
    onSent();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card p-6 sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Terminate {hire.worker_name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This sends a formal termination request to the back office for approval.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-5 block text-sm font-semibold">
          Reason for termination
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 font-normal outline-none focus:border-primary"
          >
            {TERMINATION_REASONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>

        <label className="mt-4 block text-sm font-semibold">
          Additional context (optional)
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            maxLength={2000}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 font-normal outline-none focus:border-primary"
            placeholder="Anything the back office should know before deciding…"
          />
        </label>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onClose} className="btn-outline-brand flex-1 text-sm">Cancel</button>
          <button disabled={busy} className="btn-brand flex-1 text-sm disabled:opacity-60">
            {busy ? "Sending…" : "Send termination request"}
          </button>
        </div>
      </form>
    </div>
  );
}
