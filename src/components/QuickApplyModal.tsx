import { useId, useState } from "react";
import { ChevronDown, FileText, UploadCloud, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadApplicationFile } from "@/lib/application-files";

export type QuickApplyDraft = {
  full_name: string;
  phone: string;
  address: string;
  email: string;
  experience: string;
  education: { level: string; institution: string; field: string; year: string };
};

const empty: QuickApplyDraft = {
  full_name: "",
  phone: "",
  address: "",
  email: "",
  experience: "",
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

const STEPS = ["Your details", "Experience & documents", "Create account"];

/**
 * Three-step application for candidates without an account:
 * 1. personal details, 2. education / CV / experience, 3. account creation,
 * then the application is submitted and linked to the new account.
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
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<QuickApplyDraft>(loadDraft);
  const [showEdu, setShowEdu] = useState(false);
  const [cv, setCv] = useState<File | null>(null);
  const [eduDoc, setEduDoc] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof QuickApplyDraft>(key: K, value: QuickApplyDraft[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function saveDraft(next: QuickApplyDraft) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* draft is best-effort */
    }
  }

  function next() {
    setError(null);
    if (step === 0) {
      if (!form.full_name.trim() || !form.phone.trim() || !form.address.trim()) {
        return setError("Name, address and phone are required.");
      }
    }
    saveDraft(form);
    setStep((s) => Math.min(s + 1, 2));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const email = form.email.trim();
    if (!email) return setError("An email is required to create your account.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("The two passwords do not match.");

    setSaving(true);
    try {
      // 1. Create the employee account and sign in.
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/my-applications`,
          data: { full_name: form.full_name.trim(), phone: form.phone.trim(), role: "employee" },
        },
      });
      if (signUpErr) throw signUpErr;
      let userId = signUpData.user?.id ?? null;
      if (!signUpData.session) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) throw signInErr;
        userId = signInData.user?.id ?? userId;
      }

      // 2. Upload documents, then submit the application against the new account.
      const cvPath = cv ? await uploadApplicationFile(jobId, cv, "cv") : null;
      const eduPath = eduDoc ? await uploadApplicationFile(jobId, eduDoc, "education") : null;
      const hasEdu = Object.values(form.education).some((v) => v.trim());

      const { error: insertErr } = await supabase.from("job_applications").insert({
        job_id: jobId,
        applicant_id: userId,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        email,
        experience: form.experience.trim() || null,
        education: hasEdu ? form.education : null,
        cv_path: cvPath,
        education_document: eduPath,
        profile_complete: false,
      });
      if (insertErr) throw insertErr;

      saveDraft(form);
      onApplied();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
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

        {/* Steps */}
        <div className="flex items-center gap-2 border-b border-border/60 px-6 py-3">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`flex flex-1 items-center gap-1.5 text-[11px] font-semibold ${
                i <= step ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                  i <= step ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}
              >
                {i + 1}
              </span>
              <span className="truncate">{label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5">
          {step === 0 && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium">Full name</span>
                <input
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  className={field}
                  placeholder="Your full name"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Address</span>
                <input
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  className={field}
                  placeholder="City, region"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Phone number</span>
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  inputMode="tel"
                  className={field}
                  placeholder="09xxxxxxxx"
                />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowEdu((s) => !s)}
                className="flex w-full items-center justify-between rounded-xl border border-border/60 px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-secondary/50"
                aria-expanded={showEdu}
              >
                <span>Educational background</span>
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
                    <span className="text-xs font-medium text-muted-foreground">Educational document</span>
                    <FileButton
                      file={eduDoc}
                      onFile={setEduDoc}
                      label="Upload document"
                      hint="PDF, DOC or image"
                    />
                  </div>
                </div>
              )}

              <div>
                <span className="text-sm font-medium">CV / resume</span>
                <FileButton file={cv} onFile={setCv} label="Upload CV" hint="PDF, DOC or image" />
              </div>

              <label className="block">
                <span className="text-sm font-medium">Work experience</span>
                <textarea
                  value={form.experience}
                  onChange={(e) => set("experience", e.target.value)}
                  rows={4}
                  className={field}
                  placeholder="Where you worked, for how long, and what you did"
                />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create your account so you can sign in later and follow your application.
              </p>
              <label className="block">
                <span className="text-sm font-medium">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={field}
                  placeholder="you@example.com"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={field}
                  placeholder="At least 6 characters"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Confirm password</span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={field}
                />
              </label>
              <p className="text-center text-xs text-muted-foreground">
                You can complete the rest of your profile later — your details are saved.
              </p>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
        </form>

        {/* Sticky footer */}
        <div className="flex items-center gap-3 border-t border-border/60 bg-card px-6 py-4">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="btn-outline-brand text-sm"
              disabled={saving}
            >
              Back
            </button>
          )}
          {step < 2 ? (
            <button type="button" onClick={next} className="btn-brand flex-1">
              Continue
            </button>
          ) : (
            <button onClick={submit} disabled={saving} className="btn-brand flex-1 disabled:opacity-60">
              {saving ? "Sending…" : "Create account & apply"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
