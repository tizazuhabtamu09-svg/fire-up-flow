import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { sectorLabel } from "@/lib/app-config";
import { FileUpload } from "@/components/FileUpload";
import { uploadFile } from "@/lib/uploads";
import { BrokerNav } from "@/components/BrokerNav";
import type { Database } from "@/integrations/supabase/types";

type Employer = Database["public"]["Tables"]["broker_employers"]["Row"];
type WorkerRow = Database["public"]["Tables"]["workers"]["Row"];

export const Route = createFileRoute("/_authenticated/broker/assign")({
  validateSearch: (s: Record<string, unknown>) => ({
    employer: typeof s["employer"] === "string" ? s["employer"] : undefined,
    worker: typeof s["worker"] === "string" ? s["worker"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "New assignment — Agaze/አጋዝ" },
      { name: "description", content: "Assign one of your registered workers to a registered employer." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AssignPage,
});

const cls = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:border-primary";

function AssignPage() {
  const { employer, worker } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useSession();
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [query, setQuery] = useState("");
  const [employerId, setEmployerId] = useState(employer ?? "");
  const [workerId, setWorkerId] = useState(worker ?? "");
  const [witness, setWitness] = useState({ name: "", phone: "", sex: "" as "" | "male" | "female" | "other" });
  const [agreement, setAgreement] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("broker_employers").select("*").eq("broker_id", user.id).then(({ data }) => setEmployers(data ?? []));
    supabase.from("workers").select("*").eq("owner_id", user.id).then(({ data }) => setWorkers(data ?? []));
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employers;
    return employers.filter((e) => e.full_name.toLowerCase().includes(q) || (e.phone ?? "").includes(q));
  }, [employers, query]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!employerId) return setError("Select an employer.");
    if (!workerId) return setError("Select a worker.");
    setSaving(true);
    setError(null);
    try {
      const path = agreement ? await uploadFile("id-documents", user.id, "agreement", agreement) : null;
      const { error: err } = await supabase.from("assignments").insert({
        broker_id: user.id,
        employer_ref: employerId,
        worker_ref: workerId,
        agreement_path: path,
        witness_name: witness.name,
        witness_phone: witness.phone,
        witness_sex: witness.sex || null,
      });
      if (err) throw err;
      navigate({ to: "/broker/assignments" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <BrokerNav />
      <h1 className="text-3xl font-bold">New assignment</h1>
      <p className="font-amharic text-muted-foreground">አዲስ ምደባ</p>

      <form onSubmit={submit} className="card-soft mt-6 space-y-6 p-6">
        <div>
          <span className="text-sm font-medium">1. Search and select an employer *</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or phone…" className={cls} />
          <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
            {filtered.map((e) => (
              <button
                type="button"
                key={e.id}
                onClick={() => setEmployerId(e.id)}
                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm ${
                  employerId === e.id ? "border-primary bg-secondary" : "border-border"
                }`}
              >
                <span>
                  <strong>{e.full_name}</strong>
                  {e.phone ? ` · ${e.phone}` : ""}
                  {e.city ? ` · ${e.city}` : ""}
                </span>
                {employerId === e.id && <span className="text-xs font-semibold text-primary">Selected</span>}
              </button>
            ))}
            {filtered.length === 0 && <p className="text-sm text-muted-foreground">No registered employers match.</p>}
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium">2. Select one of your employees *</span>
          <select value={workerId} onChange={(e) => setWorkerId(e.target.value)} className={cls} required>
            <option value="">Choose a worker…</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name} — {sectorLabel(w.sector)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">3. Agreement file</span>
          <FileUpload file={agreement} onFile={setAgreement} accept=".pdf,.doc,.docx,image/*" preview={false} label="Upload the signed agreement" height="h-24" />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium">Witness full name *</span>
            <input required value={witness.name} onChange={(e) => setWitness({ ...witness, name: e.target.value })} className={cls} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Witness phone *</span>
            <input required value={witness.phone} onChange={(e) => setWitness({ ...witness, phone: e.target.value })} className={cls} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Witness sex</span>
            <select value={witness.sex} onChange={(e) => setWitness({ ...witness, sex: e.target.value as typeof witness.sex })} className={cls}>
              <option value="">Not specified</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
          Assignments can't be edited after creation — only an admin can change them.
        </p>
        <button disabled={saving} className="btn-brand text-sm disabled:opacity-60">
          {saving ? "Creating…" : "Create assignment"}
        </button>
      </form>
    </div>
  );
}
