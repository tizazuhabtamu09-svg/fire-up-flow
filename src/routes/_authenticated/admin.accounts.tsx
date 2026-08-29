import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createManagedAccount } from "@/lib/admin-accounts.functions";
import { AdminSection, adminInput } from "@/components/admin/shared";

export const Route = createFileRoute("/_authenticated/admin/accounts")({
  component: AdminAccounts,
});

type Credentials = { email: string; password: string; kind: string };

const ROLES = [
  { value: "employee", label: "Employee" },
  { value: "employer", label: "Employer" },
  { value: "broker", label: "Broker" },
] as const;

function AdminAccounts() {
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  return (
    <AdminSection
      title="Create accounts"
      description="Create Employee, Employer and Broker sign-in accounts. A one-time password is generated and the account must change it on first login. Sub-admin and KYC accounts are managed under Roles & permissions."
    >
      <div className="grid gap-6">
        <ManagedAccountForm onCreated={setCredentials} />
      </div>
      {credentials && <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />}
    </AdminSection>
  );
}

function ManagedAccountForm({ onCreated }: { onCreated: (c: Credentials) => void }) {
  const create = useServerFn(createManagedAccount);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", city: "", role: "employee", verified: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await create({
        data: {
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          city: form.city,
          role: form.role as "employee" | "employer" | "broker" | "kyc",
          verified: form.verified,
        },
      });
      onCreated({ email: result.email, password: result.password, kind: form.role });
      setForm({ full_name: "", email: "", phone: "", city: "", role: form.role, verified: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="card-soft grid gap-3 p-6">
      <h2 className="text-lg font-bold">Employee, Employer, Broker or KYC</h2>
      <select className={adminInput} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      <input className={adminInput} placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
      <input className={adminInput} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <input className={adminInput} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <input className={adminInput} placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} />
        Mark as verified straight away (KYC complete)
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button disabled={busy} className="btn-brand text-sm disabled:opacity-60">{busy ? "Creating…" : "Create account"}</button>
    </form>
  );
}

function CredentialsModal({ credentials, onClose }: { credentials: Credentials; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
      <div className="card-soft w-full max-w-md p-6">
        <h2 className="text-xl font-bold">One-time password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share these details with the new {credentials.kind}. This password is shown only once and must be changed on first sign-in.
        </p>
        <dl className="mt-4 space-y-2 rounded-xl bg-secondary p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-semibold break-all">{credentials.email}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Password</dt>
            <dd className="font-mono font-semibold break-all">{credentials.password}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(`${credentials.email} / ${credentials.password}`);
              setCopied(true);
            }}
            className="btn-outline-brand text-sm"
          >
            {copied ? "Copied" : "Copy credentials"}
          </button>
          <button onClick={onClose} className="btn-brand text-sm">Done</button>
        </div>
      </div>
    </div>
  );
}
