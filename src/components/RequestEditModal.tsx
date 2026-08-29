import { useState } from "react";
import { X } from "lucide-react";
import { EDITABLE_FIELDS, submitChangeRequest, type ChangeTarget } from "@/lib/change-requests";

const cls = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

/**
 * Brokers cannot write registration data directly — the edited values are sent
 * to admin/KYC and only applied to the record once approved.
 */
export function RequestEditModal({
  target,
  record,
  requestedBy,
  requesterName,
  onClose,
  onSubmitted,
}: {
  target: ChangeTarget;
  record: Record<string, unknown>;
  requestedBy: string;
  requesterName: string | null;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const fields = EDITABLE_FIELDS[target];
  const initial = Object.fromEntries(
    fields.map((f) => [f.key, record[f.key] == null ? "" : String(record[f.key])]),
  ) as Record<string, string>;

  const [form, setForm] = useState(initial);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const changes: Record<string, string | number | null> = {};
    for (const f of fields) {
      const next = form[f.key]?.trim() ?? "";
      if (next === (initial[f.key] ?? "")) continue;
      changes[f.key] = next === "" ? null : f.type === "number" ? Number(next) : next;
    }
    if (Object.keys(changes).length === 0) {
      setError("Change at least one field before submitting.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await submitChangeRequest({
        target,
        targetId: String(record["id"]),
        targetName: String(record["full_name"] ?? "Unnamed"),
        requestedBy,
        requesterName,
        changes,
        note: note.trim() || null,
      });
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <form onSubmit={submit} className="my-8 w-full max-w-2xl rounded-2xl bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Request document update</h2>
            <p className="text-xs text-muted-foreground">
              Your changes are sent to admin / KYC for approval and apply instantly once approved.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{f.label}</label>
              <input
                type={f.type === "number" ? "number" : "text"}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                className={cls}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Reason for the update
            </label>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={cls} />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-outline-brand">Cancel</button>
          <button type="submit" disabled={saving} className="btn-brand disabled:opacity-60">
            {saving ? "Submitting…" : "Submit for approval"}
          </button>
        </div>
      </form>
    </div>
  );
}
