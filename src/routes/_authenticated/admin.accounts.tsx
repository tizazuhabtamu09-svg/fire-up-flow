import { useLanguage } from "@/lib/i18n";import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createManagedAccount } from "@/lib/admin-accounts.functions";
import { AdminSection, adminInput } from "@/components/admin/shared";

export const Route = createFileRoute("/_authenticated/admin/accounts")({
  component: AdminAccounts
});

type Credentials = {email: string;password: string;kind: string;};

const ROLES = [
{ value: "employee", label: "Employee" },
{ value: "employer", label: "Employer" },
{ value: "broker", label: "Broker" }] as
const;

function AdminAccounts() {const { t } = useLanguage();
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  return (
    <AdminSection
      title={t("ui.create.accounts")}
      description="Create Employee, Employer and Broker sign-in accounts. A one-time password is generated and the account must change it on first login. Sub-admin and KYC accounts are managed under Roles & permissions.">
      
      <div className="grid gap-6">
        <ManagedAccountForm onCreated={setCredentials} />
      </div>
      {credentials && <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />}
    </AdminSection>);

}

function ManagedAccountForm({ onCreated }: {onCreated: (c: Credentials) => void;}) {const { t } = useLanguage();
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
          verified: form.verified
        }
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
      <h2 className="text-lg font-bold">{t("ui.employee.employer.broker.or.kyc")}</h2>
      <select className={adminInput} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
        {ROLES.map((r) =>
        <option key={r.value} value={r.value}>{r.label}</option>
        )}
      </select>
      <input className={adminInput} placeholder={t("ui.full.name")} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
      <input className={adminInput} type="email" placeholder={t("ui.email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <input className={adminInput} placeholder={t("ui.phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <input className={adminInput} placeholder={t("ui.city")} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} />{t("ui.mark.as.verified.straight.away.kyc.complete")}

      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button disabled={busy} className="btn-brand text-sm disabled:opacity-60">{busy ? "Creating…" : "Create account"}</button>
    </form>);

}

function CredentialsModal({ credentials, onClose }: {credentials: Credentials;onClose: () => void;}) {const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
      <div className="card-soft w-full max-w-md p-6">
        <h2 className="text-xl font-bold">{t("ui.one.time.password")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("ui.share.these.details.with.the.new")}
          {credentials.kind}{t("ui.this.password.is.shown.only.once.and.must.be.changed.o")}
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
