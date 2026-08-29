import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DURATIONS,
  SECTOR_QUESTIONS,
  loadPublicEmployee,
  sectorGroup,
  type PublicEmployee,
  type RequestField,
} from "@/lib/employee-request";

export const Route = createFileRoute("/_authenticated/request/$id")({
  component: TellUsAboutYou,
});

const input = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function TellUsAboutYou() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState<PublicEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState(DURATIONS[0]);
  const [budget, setBudget] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPublicEmployee(id).then((w) => {
      setWorker(w);
      setBudget(w?.rate ? String(w.rate) : "");
      setLoading(false);
    });
  }, [id]);

  const fields = useMemo<RequestField[]>(
    () => (worker ? SECTOR_QUESTIONS[sectorGroup(worker.sector || worker.role)] : []),
    [worker],
  );

  const visible = fields.filter((f) => !f.showIf || answers[f.showIf.field] === f.showIf.value);

  function set(name: string, value: string) {
    setAnswers((a) => ({ ...a, [name]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!worker) return;
    setError(null);

    const missing = visible.find((f) => f.required && !(answers[f.name] ?? "").trim());
    if (missing) {
      setError(`Please fill in “${missing.label}”.`);
      return;
    }
    if (!location.trim()) {
      setError("Please tell us where the work is.");
      return;
    }

    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      navigate({ to: "/auth" });
      return;
    }

    const { error: err } = await supabase.from("employee_requests").insert({
      employer_id: uid,
      employee_ref: worker.demo ? null : worker.id,
      employee_name: worker.name,
      sector: worker.role,
      sector_answers: answers,
      location,
      duration,
      budget: budget ? Number(budget) : null,
      contact_phone: phone || null,
      message: message || null,
      status: "PENDING_ADMIN_REVIEW",
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate({ to: "/my-requests" });
  }

  if (loading) return <div className="container-page py-20 text-center text-muted-foreground">Loading…</div>;

  if (!worker) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold">Worker not found</h1>
        <Link to="/workers" className="btn-brand mt-6 inline-block">Back to browse</Link>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--gradient-warm)" }}>
      <div className="container-page py-10">
        <Link to="/employee/$id" params={{ id }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>

        <form onSubmit={submit} className="mx-auto mt-4 max-w-2xl">
          <h1 className="text-3xl font-bold">Tell us about you</h1>
          <p className="font-amharic text-muted-foreground">ስለ እርስዎ ይንገሩን</p>
          <p className="mt-2 text-sm text-muted-foreground">
            You are requesting <span className="font-semibold text-foreground">{worker.name}</span> · {worker.role}.
            Submitting is free — our team reviews it, assigns a candidate and sends you an itemised cost proposal.
          </p>

          <section className="card-soft mt-6 space-y-4 p-6">
            <h2 className="text-lg font-bold">Your requirements</h2>
            <Field label="Location (address, neighbourhood or city)" required>
              <input className={input} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bole, Addis Ababa" />
            </Field>
            <Field label="Employment duration" required>
              <select className={input} value={duration} onChange={(e) => setDuration(e.target.value)}>
                {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Salary budget (ETB / month)">
                <input className={input} type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} />
              </Field>
              <Field label="Additional contact phone (optional)">
                <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09…" />
              </Field>
            </div>
          </section>

          <section className="card-soft mt-6 space-y-4 p-6">
            <h2 className="text-lg font-bold">{worker.role} details</h2>
            {visible.map((f) => (
              <Field key={f.name} label={f.label} required={f.required}>
                {f.type === "textarea" ? (
                  <textarea className={`${input} min-h-24`} value={answers[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} />
                ) : f.type === "select" ? (
                  <select className={input} value={answers[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)}>
                    <option value="">Select…</option>
                    {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === "toggle" ? (
                  <div className="flex gap-2">
                    {(f.options ?? ["Yes", "No"]).map((o) => (
                      <button
                        type="button"
                        key={o}
                        onClick={() => set(f.name, o)}
                        className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                          answers[f.name] === o ? "text-white" : "bg-secondary text-foreground"
                        }`}
                        style={answers[f.name] === o ? { background: "var(--gradient-brand)", color: "var(--brand-foreground)" } : undefined}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    className={input}
                    type={f.type === "number" ? "number" : "text"}
                    min={f.type === "number" ? 0 : undefined}
                    value={answers[f.name] ?? ""}
                    onChange={(e) => set(f.name, e.target.value)}
                  />
                )}
              </Field>
            ))}
          </section>

          <section className="card-soft mt-6 space-y-4 p-6">
            <h2 className="text-lg font-bold">Message to the review team</h2>
            <p className="text-sm text-muted-foreground">Ask the admin / KYC team anything, or request extra information about this worker.</p>
            <textarea className={`${input} min-h-24`} value={message} onChange={(e) => setMessage(e.target.value)} />
          </section>

          {error && <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

          <button type="submit" disabled={saving} className="btn-brand mt-6 w-full disabled:opacity-60">
            {saving ? "Submitting…" : "Submit request — no payment needed"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block animate-in fade-in slide-in-from-top-1">
      <span className="mb-1 block text-sm font-semibold">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      {children}
    </label>
  );
}
