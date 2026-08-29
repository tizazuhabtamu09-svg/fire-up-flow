import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TERMINATION_REASONS } from "@/lib/employees";
import type { EmployerMapping } from "@/lib/employee-employer";

/**
 * Employee-side termination request: routed to the employer for acknowledgement
 * (direct placements) and then to KYC/admin for the final decision.
 */
export function EmployeeTerminateModal({
  mapping,
  workerId,
  employeeId,
  onClose,
  onSent,
}: {
  mapping: EmployerMapping;
  workerId: string;
  employeeId: string;
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
    const { error: err } = await supabase.from("employee_termination_requests").insert({
      employee_id: employeeId,
      worker_id: workerId,
      hired_id: mapping.hiredId,
      assignment_id: mapping.assignmentId,
      employer_id: mapping.employerId,
      broker_employer_id: mapping.brokerEmployerId,
      employer_name: mapping.employerName,
      reason,
      details: details.trim().slice(0, 2000) || null,
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
            <h2 className="text-xl font-bold">Request termination</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This asks to end your placement with {mapping.employerName}.
              {mapping.kind === "direct"
                ? " Your employer is asked to acknowledge it, then the back office makes the final decision."
                : " The back office reviews it together with your broker."}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-5 block text-sm font-semibold">
          Reason
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
