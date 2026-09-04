import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadApplicationFile } from "@/lib/application-files";

export type QuickApplyDraft = {
  full_name: string;
  phone: string;
  address: string;
  email: string;
  education: { level: string; institution: string; field: string; year: string };
};

const empty: QuickApplyDraft = {
  full_name: "",
  phone: "",
  address: "",
  email: "",
  education: { level: "", institution: "", field: "", year: "" },
};

const STORAGE_KEY = "agaze-candidate-draft";

function loadDraft(): QuickApplyDraft {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch {
    return empty;
  }
}

const field =
  "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

/**
 * One-step application for candidates who don't have an account yet.
 * Saves the application immediately and keeps the draft locally so the
 * candidate can finish their full profile later.
 */
export function QuickApplyModal({
  jobId,
  jobTitle,
  onClose,
  onApplied,
}: {
  jobId: string;
  jobTitle: string;
  onClose: () => void;
  onApplied: () => void;
}) {
  const [form, setForm] = useState<QuickApplyDraft>(loadDraft);
  const [showEdu, setShowEdu] = useState(false);
  const [cv, setCv] = useState<File | null>(null);
  const [eduDoc, setEduDoc] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof QuickApplyDraft>(key: K, value: QuickApplyDraft[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim() || !form.address.trim()) {
      return setError("Name, address and phone are required.");
    }
    setSaving(true);
    setError(null);
    const hasEdu = Object.values(form.education).some((v) => v.trim());
    let cvPath: string | null = null;
    let eduPath: string | null = null;
    try {
      if (cv) cvPath = await uploadApplicationFile(jobId, cv, "cv");
      if (eduDoc) eduPath = await uploadApplicationFile(jobId, eduDoc, "education");
    } catch (uploadError) {
      setSaving(false);
      return setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    }
    const { data: session } = await supabase.auth.getSession();
    const { error: err } = await supabase.from("job_applications").insert({
      job_id: jobId,
      applicant_id: session.session?.user.id ?? null,
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      email: form.email.trim() || null,
      education: hasEdu ? form.education : null,
      cv_path: cvPath,
      education_document: eduPath,
      profile_complete: false,
    });
    setSaving(false);
    if (err) return setError(err.message);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      /* draft is best-effort */
    }
    onApplied();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-card p-6 shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Apply now</h2>
            <p className="text-xs text-muted-foreground">{jobTitle}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Full name</span>
            <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required className={field} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Address</span>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} required className={field} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Phone number</span>
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              required
              inputMode="tel"
              className={field}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Email (optional)</span>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={field} />
          </label>

          <button
            type="button"
            onClick={() => setShowEdu((s) => !s)}
            className="w-full rounded-xl border border-border/60 px-3 py-2 text-left text-sm font-semibold"
          >
            {showEdu ? "− " : "+ "}Add educational background (optional)
          </button>
          {showEdu && (
            <div className="space-y-3 rounded-xl border border-border/60 p-3">
              {(
                [
                  ["level", "Level (e.g. Diploma)"],
                  ["institution", "Institution"],
                  ["field", "Field of study"],
                  ["year", "Graduation year"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block">
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <input
                    value={form.education[key]}
                    onChange={(e) => set("education", { ...form.education, [key]: e.target.value })}
                    className={field}
                  />
                </label>
              ))}
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Educational document (optional)</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={(e) => setEduDoc(e.target.files?.[0] ?? null)}
                  className="mt-1 w-full text-xs"
                />
              </label>
            </div>
          )}

          <label className="block">
            <span className="text-sm font-medium">CV / resume (optional)</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              onChange={(e) => setCv(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-xs"
            />
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <button disabled={saving} className="btn-brand w-full disabled:opacity-60">
            {saving ? "Sending…" : "Submit and Apply"}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            You can complete your full profile later — your details are saved.
          </p>
        </form>
      </div>
    </div>
  );
}
