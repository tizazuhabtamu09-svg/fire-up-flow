import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Modal } from "@/components/employer/RateWorkerModal";
import { EMPLOYER_REPORT_REASONS, REPORT_MAX_BYTES, type EmployerMapping } from "@/lib/employee-employer";

const input = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

/** Employee reports their employer to the compliance team, with optional evidence files (max 100 MB each). */
export function ReportEmployerModal({
  mapping,
  workerId,
  employeeId,
  onClose,
}: {
  mapping: EmployerMapping;
  workerId: string;
  employeeId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<string>(EMPLOYER_REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function pickFiles(list: FileList | null) {
    const next = Array.from(list ?? []);
    const tooBig = next.find((f) => f.size > REPORT_MAX_BYTES);
    if (tooBig) {
      setError(`"${tooBig.name}" is larger than 100 MB. Please choose a smaller file.`);
      return;
    }
    setError(null);
    setFiles(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const attachments: { path: string; name: string }[] = [];
    for (const file of files) {
      if (file.size > REPORT_MAX_BYTES) {
        setError(`"${file.name}" is larger than 100 MB.`);
        setSaving(false);
        return;
      }
      const path = `${employeeId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("report-evidence").upload(path, file);
      if (upErr) {
        setError(`Upload failed: ${upErr.message}`);
        setSaving(false);
        return;
      }
      attachments.push({ path, name: file.name });
    }

    const { error: err } = await supabase.from("employer_reports").insert({
      employee_id: employeeId,
      worker_id: workerId,
      employer_id: mapping.employerId,
      broker_employer_id: mapping.brokerEmployerId,
      employer_name: mapping.employerName,
      reason,
      details: details.trim().slice(0, 4000) || null,
      attachments,
    });
    setSaving(false);
    if (err) setError(err.message);
    else setDone(true);
  }

  return (
    <Modal title={`Report ${mapping.employerName}`} onClose={onClose}>
      {done ? (
        <div className="text-center">
          <p className="text-sm">
            Your report was sent to the compliance team. It is logged in the audit trail and staff will respond to you directly.
          </p>
          <button onClick={onClose} className="btn-brand mt-4 text-sm">Close</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-semibold">
            Reason
            <select className={`${input} mt-1`} value={reason} onChange={(e) => setReason(e.target.value)}>
              {EMPLOYER_REPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            What happened?
            <textarea
              className={`${input} mt-1 min-h-28`}
              maxLength={4000}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the issue with dates and any witnesses…"
            />
          </label>
          <label className="block text-sm font-semibold">
            Evidence (images, video or PDF — up to 100 MB per file)
            <input
              className={`${input} mt-1`}
              type="file"
              multiple
              accept="image/*,video/*,application/pdf,.txt,.doc,.docx"
              onChange={(e) => pickFiles(e.target.files)}
            />
            {files.length > 0 && (
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                {files.map((f) => `${f.name} (${(f.size / (1024 * 1024)).toFixed(1)} MB)`).join(", ")}
              </span>
            )}
          </label>
          {error && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={saving} className="btn-brand w-full text-sm disabled:opacity-60">
            {saving ? "Sending…" : "Send report"}
          </button>
        </form>
      )}
    </Modal>
  );
}
