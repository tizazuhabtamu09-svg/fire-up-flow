import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Modal } from "@/components/employer/RateWorkerModal";
import { REPORT_CATEGORIES, REPORT_FORMS, type HiredEmployee, type ReportCategory } from "@/lib/requests";

const input = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

/** Incident intake: employer picks a category, fills the structured form and uploads evidence. */
export function IncidentReportModal({ hire, onClose }: { hire: HiredEmployee; onClose: () => void }) {
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const fields = category ? REPORT_FORMS[category] : [];
  const visible = fields.filter((f) => !f.showIf || values[f.showIf.field] === f.showIf.value);

  function set(name: string, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) return;
    const missing = visible.find((f) => f.required && !(values[f.name] ?? "").trim());
    if (missing) {
      setError(`Please fill in “${missing.label}”.`);
      return;
    }
    setSaving(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setSaving(false);
      return;
    }

    const paths: string[] = [];
    for (const file of files) {
      const path = `${uid}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("incident-evidence").upload(path, file);
      if (upErr) {
        setError(`Upload failed: ${upErr.message}`);
        setSaving(false);
        return;
      }
      paths.push(path);
    }

    const details: Record<string, string> = {};
    for (const f of visible) if (values[f.name]) details[f.name] = values[f.name];

    const { error: err } = await supabase.from("incident_reports").insert({
      employer_id: uid,
      hired_id: hire.id,
      worker_ref: hire.worker_ref,
      worker_name: hire.worker_name,
      category,
      details,
      attachments: paths,
    });
    setSaving(false);
    if (err) setError(err.message);
    else setDone(true);
  }

  return (
    <Modal title={`Submit incident report — ${hire.worker_name}`} onClose={onClose}>
      {done ? (
        <div className="text-center">
          <p className="text-sm">Your report was sent to the Agaze compliance team. They will respond to you directly.</p>
          <button onClick={onClose} className="btn-brand mt-4 text-sm">Close</button>
        </div>
      ) : !category ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Choose the type of issue you want to report.</p>
          {REPORT_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className="w-full rounded-2xl border border-border p-4 text-left transition hover:border-primary"
            >
              <p className="font-semibold">{c.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
            </button>
          ))}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <button type="button" onClick={() => setCategory(null)} className="text-sm text-primary">← Change category</button>
          {visible.map((f) => (
            <label key={f.name} className="block text-sm font-semibold">
              {f.label}
              {f.required && <span className="text-destructive"> *</span>}
              {f.type === "textarea" ? (
                <textarea
                  className={`${input} mt-1 min-h-28`}
                  maxLength={f.maxLength}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              ) : f.type === "select" ? (
                <select className={`${input} mt-1`} value={values[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)}>
                  <option value="">Select…</option>
                  {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === "toggle" ? (
                <div className="mt-1 flex gap-2">
                  {(f.options ?? ["Yes", "No"]).map((o) => (
                    <button
                      type="button"
                      key={o}
                      onClick={() => set(f.name, o)}
                      className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                        values[f.name] === o ? "bg-primary text-primary-foreground" : "bg-secondary"
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  className={`${input} mt-1`}
                  type={f.type === "datetime" ? "datetime-local" : f.type === "date" ? "date" : "text"}
                  maxLength={f.maxLength ?? 200}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}
            </label>
          ))}

          <label className="block text-sm font-semibold">
            Supporting documents (photos, log extracts, PDFs)
            <input
              className={`${input} mt-1`}
              type="file"
              multiple
              accept="image/*,application/pdf,.txt,.doc,.docx"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
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
