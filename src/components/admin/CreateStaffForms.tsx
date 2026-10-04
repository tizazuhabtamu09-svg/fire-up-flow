import { useLanguage } from "@/lib/i18n";import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createManagedAccount, createSubAdminAccount } from "@/lib/admin-accounts.functions";
import { adminInput } from "@/components/admin/shared";

type Credentials = {email: string;password: string;kind: string;};

const PERMISSIONS = [
{ key: "users", label: "Manage users" },
{ key: "verification", label: "Verify documents" },
{ key: "pricing", label: "Manage pricing" },
{ key: "payments", label: "Review payments" },
{ key: "bookings", label: "Manage bookings" }];


export function CreateStaffPanel({ onCreated }: {onCreated?: () => void;}) {const { t } = useLanguage();
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  function handleCreated(c: Credentials) {
    setCredentials(c);
    onCreated?.();
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold">{t("ui.create.staff.accounts")}</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("ui.a.random.temporary.password.is.generated.and.shown.onc")}


      </p>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <SubAdminForm onCreated={handleCreated} />
        <KycReviewerForm onCreated={handleCreated} />
      </div>
      {credentials && <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />}
    </div>);

}

function SubAdminForm({ onCreated }: {onCreated: (c: Credentials) => void;}) {const { t } = useLanguage();
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
          permissions
        }
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
      <h3 className="text-base font-bold">{t("ui.sub.admin")}</h3>
      <input className={adminInput} placeholder={t("ui.full.name")} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
      <input className={adminInput} type="email" placeholder={t("ui.email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={adminInput} placeholder={t("ui.phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className={adminInput} placeholder={t("ui.fayda.number")} value={form.fayda_number} onChange={(e) => setForm({ ...form, fayda_number: e.target.value })} />
        <input className={adminInput} type="number" placeholder={t("ui.age")} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
        <select className={adminInput} value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
          <option value="">{t("ui.sex")}</option>
          <option value="male">{t("ui.male")}</option>
          <option value="female">{t("ui.female")}</option>
          <option value="other">{t("ui.other")}</option>
        </select>
        <input className={adminInput} placeholder={t("ui.city")} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <input className={adminInput} placeholder={t("ui.woreda")} value={form.woreda} onChange={(e) => setForm({ ...form, woreda: e.target.value })} />
      </div>
      <fieldset className="rounded-xl bg-secondary/50 p-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("ui.permissions")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {PERMISSIONS.map((p) =>
          <label key={p.key} className="flex items-center gap-2 text-sm">
              <input
              type="checkbox"
              checked={Boolean(permissions[p.key])}
              onChange={(e) => setPermissions({ ...permissions, [p.key]: e.target.checked })} />
            
              {p.label}
            </label>
          )}
        </div>
      </fieldset>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button disabled={busy} className="btn-brand text-sm disabled:opacity-60">{busy ? "Creating…" : "Create sub-admin"}</button>
    </form>);

}

function KycReviewerForm({ onCreated }: {onCreated: (c: Credentials) => void;}) {const { t } = useLanguage();
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
          verified: true
        }
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
      <h3 className="text-base font-bold">{t("ui.kyc.reviewer")}</h3>
      <p className="text-sm text-muted-foreground">{t("ui.kyc.reviewers.can.open.the.verification.console.to.vie")}

      </p>
      <input className={adminInput} placeholder={t("ui.full.name")} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
      <input className={adminInput} type="email" placeholder={t("ui.email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={adminInput} placeholder={t("ui.phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className={adminInput} placeholder={t("ui.city")} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button disabled={busy} className="btn-brand text-sm disabled:opacity-60">{busy ? "Creating…" : "Create KYC reviewer"}</button>
    </form>);

}

export function CredentialsModal({ credentials, onClose }: {credentials: Credentials;onClose: () => void;}) {const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
      <div className="card-soft w-full max-w-md p-6">
        <h2 className="text-xl font-bold">{t("ui.temporary.password")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("ui.provide.these.credentials.to.the")}
          {credentials.kind}{t("ui.they.will.be.required.to.change.their.password.upon.in")}

        </p>

        <dl className="mt-4 space-y-2 rounded-xl bg-secondary p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{t("ui.email")}</dt>
            <dd className="font-semibold break-all">{credentials.email}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{t("ui.password")}</dt>
            <dd className="font-mono font-semibold break-all">{credentials.password}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(`${credentials.email} / ${credentials.password}`);
              setCopied(true);
            }}
            className="btn-outline-brand text-sm">
            
            {copied ? "Copied" : "Copy credentials"}
          </button>
          <button onClick={onClose} className="btn-brand text-sm">{t("ui.done")}</button>
        </div>
      </div>
    </div>);

}
