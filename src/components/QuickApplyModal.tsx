import { useId, useState } from "react";
import { ChevronDown, FileText, UploadCloud, X } from "lucide-react";
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
  "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

/** Compact, token-light file picker styled as a dropzone-style button. */
function FileButton({
  file,
  onFile,
  label,
  hint,
}: {
  file: File | null;
  onFile: (f: File | null) => void;
  label: string;
  hint: string;
}) {
  const inputId = useId();
  return (
    <div>
      <input
        id={inputId}
        type="file"
        accept=".pdf,.doc,.docx,image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <div className="mt-1 flex items-center justify-between gap-2 rounded-xl border border-input bg-background px-3 py-2.5">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{file.name}</span>
          </span>
          <button
            type="button"
            onClick={() => onFile(null)}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-destructive"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="mt-1 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-input bg-background px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        >
          <UploadCloud className="h-4 w-4 shrink-0" />
          <span className="truncate">
            <span className="font-medium text-foreground">{label}</span>
            <span className="ml-1 text-xs">{hint}</span>
          </span>
        </label>
      )}
    </div>
  );
}

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
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-card shadow-xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/60 px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold">Apply now</h2>
            <p className="truncate text-xs text-muted-foreground">{jobTitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Full name</span>
              <input
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                required
                className={field}
                placeholder="Your full name"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Address</span>
              <input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                required
                className={field}
                placeholder="City, region"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Phone number</span>
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
                inputMode="tel"
                className={field}
                placeholder="09xxxxxxxx"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">
                Email <span className="font-normal text-muted-foreground">(optional)</span>
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={field}
                placeholder="you@example.com"
              />
            </label>

            {/* Education accordion */}
            <button
              type="button"
              onClick={() => setShowEdu((s) => !s)}
              className="flex w-full items-center justify-between rounded-xl border border-border/60 px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-secondary/50"
              aria-expanded={showEdu}
            >
              <span>Add educational background</span>
              <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              <ChevronDown
                className={`ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                  showEdu ? "rotate-180" : ""
                }`}
              />
            </button>
            {showEdu && (
              <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/20 p-3">
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
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Educational document (optional)
                  </span>
                  <FileButton
                    file={eduDoc}
                    onFile={setEduDoc}
                    label="Upload document"
                    hint="PDF, DOC or image"
                  />
                </div>
              </div>
            )}

            {/* Documents */}
            <div>
              <span className="text-sm font-medium">CV / resume (optional)</span>
              <FileButton file={cv} onFile={setCv} label="Upload CV" hint="PDF, DOC or image" />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <p className="text-center text-xs text-muted-foreground">
              You can complete your full profile later — your details are saved.
            </p>
          </div>
        </form>

        {/* Sticky footer */}
        <div className="border-t border-border/60 bg-card px-6 py-4">
          <button disabled={saving} className="btn-brand w-full disabled:opacity-60">
            {saving ? "Sending…" : "Submit and Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
