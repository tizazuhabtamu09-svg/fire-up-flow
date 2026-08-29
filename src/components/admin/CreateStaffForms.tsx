import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createManagedAccount, createSubAdminAccount } from "@/lib/admin-accounts.functions";
import { adminInput } from "@/components/admin/shared";

type Credentials = { email: string; password: string; kind: string };

const PERMISSIONS = [
  { key: "users", label: "Manage users" },
  { key: "verification", label: "Verify documents" },
  { key: "pricing", label: "Manage pricing" },
  { key: "payments", label: "Review payments" },
  { key: "bookings", label: "Manage bookings" },
];

export function CreateStaffPanel({ onCreated }: { onCreated?: () => void }) {
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  function handleCreated(c: Credentials) {
    setCredentials(c);
    onCreated?.();
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold">Create staff accounts</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        A random temporary password is generated and shown once. The new account must create and confirm their own
        password on their very first sign-in.
      </p>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <SubAdminForm onCreated={handleCreated} />
        <KycReviewerForm onCreated={handleCreated} />
      </div>
      {credentials && <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />}
    </div>
  );
}

function SubAdminForm({ onCreated }: { onCreated: (c: Credentials) => void }) {
  const create = useServerFn(createSubAdminAccount);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", fayda_number: "", age: "", sex: "", city: "", woreda: "" });
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
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
          fayda_number: form.fayda_number,
          age: form.age ? Number(form.age) : null,
          sex: (form.sex || null) as "male" | "female" | "other" | null,
          city: form.city,
          woreda: form.woreda,
          permissions,
        },
      });
      onCreated({ email: result.email, password: result.password, kind: "sub-admin" });
      setForm({ full_name: "", email: "", phone: "", fayda_number: "", age: "", sex: "", city: "", woreda: "" });
      setPermissions({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the sub-admin.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="card-soft grid gap-3 p-6">
      <h3 className="text-base font-bold">Sub-Admin</h3>
      <input className={adminInput} placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
      <input className={adminInput} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={adminInput} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className={adminInput} placeholder="Fayda number" value={form.fayda_number} onChange={(e) => setForm({ ...form, fayda_number: e.target.value })} />
        <input className={adminInput} type="number" placeholder="Age" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
        <select className={adminInput} value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
          <option value="">Sex</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <input className={adminInput} placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <input className={adminInput} placeholder="Woreda" value={form.woreda} onChange={(e) => setForm({ ...form, woreda: e.target.value })} />
      </div>
      <fieldset className="rounded-xl bg-secondary/50 p-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Permissions</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {PERMISSIONS.map((p) => (
            <label key={p.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(permissions[p.key])}
                onChange={(e) => setPermissions({ ...permissions, [p.key]: e.target.checked })}
              />
              {p.label}
            </label>
          ))}
        </div>
      </fieldset>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button disabled={busy} className="btn-brand text-sm disabled:opacity-60">{busy ? "Creating…" : "Create sub-admin"}</button>
    </form>
  );
}

function KycReviewerForm({ onCreated }: { onCreated: (c: Credentials) => void }) {
  const create = useServerFn(createManagedAccount);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", city: "" });
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
          role: "kyc",
          verified: true,
        },
      });
      onCreated({ email: result.email, password: result.password, kind: "KYC reviewer" });
      setForm({ full_name: "", email: "", phone: "", city: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the KYC reviewer.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="card-soft grid gap-3 p-6">
      <h3 className="text-base font-bold">KYC Reviewer</h3>
      <p className="text-sm text-muted-foreground">
        KYC reviewers can open the Verification console to view and process user identity documents.
      </p>
      <input className={adminInput} placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
      <input className={adminInput} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={adminInput} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className={adminInput} placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button disabled={busy} className="btn-brand text-sm disabled:opacity-60">{busy ? "Creating…" : "Create KYC reviewer"}</button>
    </form>
  );
}

export function CredentialsModal({ credentials, onClose }: { credentials: Credentials; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
      <div className="card-soft w-full max-w-md p-6">
        <h2 className="text-xl font-bold">Temporary password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Provide these credentials to the {credentials.kind}. They will be required to change their password upon
          initial login. This password is shown only once.
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
