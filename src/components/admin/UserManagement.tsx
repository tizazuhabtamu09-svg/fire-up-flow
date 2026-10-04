import { useLanguage } from "@/lib/i18n";import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { roleLabels, type AppRole } from "@/lib/use-session";
import { money, sectorLabel } from "@/lib/app-config";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { adminInput } from "@/components/admin/shared";
import { WalletAdjuster } from "@/components/admin/WalletAdjuster";
import { RegistrationOrigin } from "@/components/admin/RegistrationOrigin";
import { UserRegistrationDetails } from "@/components/admin/UserRegistrationDetails";

import { deleteUserAccount, setUserPassword } from "@/lib/admin-accounts.functions";

import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type WorkerRow = Database["public"]["Tables"]["workers"]["Row"];

const FILTERS = ["all", "employee", "employer", "broker", "kyc", "admin"] as const;

/**
 * Single place where an admin manages every account: search, edit details and
 * role, approve/decline verification, adjust wallets (primary admin) and
 * permanently delete the account.
 */
export function UserManagement({
  canAdjustWallet = false,
  onChanged



}: {canAdjustWallet?: boolean;onChanged?: () => void;}) {const { t } = useLanguage();
  const removeAccount = useServerFn(deleteUserAccount);
  const resetPassword = useServerFn(setUserPassword);

  const [rows, setRows] = useState<Profile[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(() => {
    supabase.
    from("profiles").
    select("*").
    order("created_at", { ascending: false }).
    then(({ data }) => setRows(data ?? []));
  }, []);
  useEffect(load, [load]);

  const shown = rows.filter(
    (r) =>
    (filter === "all" || r.role === filter) && (
    !q ||
    `${r.full_name ?? ""} ${r.phone ?? ""} ${r.city ?? ""}`.toLowerCase().includes(q.toLowerCase()))
  );

  async function save(p: Profile, patch: Partial<Profile>) {
    setError(null);
    const { error: err } = await supabase.from("profiles").update(patch).eq("id", p.id);
    if (err) return setError(err.message);
    setRows((r) => r.map((x) => x.id === p.id ? { ...x, ...patch } : x));
    setStatus("Saved.");
    onChanged?.();
  }

  async function remove(p: Profile) {
    if (!window.confirm(`Permanently delete ${p.full_name || "this user"}? This cannot be undone.`)) return;
    setBusy(p.id);
    setError(null);
    setStatus(null);
    try {
      await removeAccount({ data: { userId: p.id } });
      setRows((r) => r.filter((x) => x.id !== p.id));
      if (expanded === p.id) setExpanded(null);
      setStatus("Account deleted.");
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete this account.");
    }
    setBusy(null);
  }

  async function changePassword(p: Profile, password: string) {
    setBusy(p.id);
    setError(null);
    setStatus(null);
    try {
      await resetPassword({ data: { userId: p.id, password } });
      setStatus("New password set. The user must change it at next sign-in.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the password.");
    }
    setBusy(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((r) =>
        <button
          key={r}
          onClick={() => setFilter(r)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${
          filter === r ? "border-primary bg-secondary" : "border-border text-muted-foreground"}`
          }>
          
            {r === "all" ? "All" : roleLabels[r as AppRole].en}
          </button>
        )}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("ui.search.name.phone.or.city")}
          className={`${adminInput} ml-auto max-w-xs`} />
        
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      {status && !error && <p className="mt-3 text-sm text-muted-foreground">{status}</p>}

      <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">{t("ui.name")}</th>
              <th className="px-4 py-3 font-semibold">{t("ui.role")}</th>
              <th className="px-4 py-3 font-semibold">{t("ui.contact")}</th>
              <th className="px-4 py-3 font-semibold">{t("ui.wallet")}</th>
              <th className="px-4 py-3 font-semibold">{t("ui.status")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("ui.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) =>
            <tr key={p.id} className="border-t border-border align-top">
                <td className="px-4 py-3 font-semibold">
                  {p.full_name || "Unnamed user"}
                  <div className="mt-1">
                    <RegistrationOrigin isAdmin type={p.registration_type} byName={p.registered_by_name} />
                  </div>
                </td>

                <td className="px-4 py-3">{roleLabels[p.role].en}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.phone || "—"}
                  {p.city ? ` · ${p.city}` : ""}
                </td>
                <td className="px-4 py-3">{money(p.wallet_balance)}</td>
                <td className="px-4 py-3">
                  <VerifiedBadge status={p.verification_status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    {p.role === "employee" &&
                  <button onClick={() => save(p, { available: !p.available })} className="btn-outline-brand text-xs">
                        {p.available ? "Available" : "Not available"}
                      </button>
                  }
                    <button
                    onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                    className="btn-outline-brand text-xs">
                    
                      {expanded === p.id ? "Close" : "Edit"}
                    </button>
                    <button
                    disabled={busy === p.id}
                    onClick={() => remove(p)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-destructive hover:underline disabled:opacity-50">
                    
                      {busy === p.id ? "Working…" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {shown.length === 0 &&
            <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t("ui.no.users.found")}

              </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      {expanded &&
      <div className="card-soft mt-6 p-5">
          {(() => {
          const p = rows.find((r) => r.id === expanded);
          if (!p) return null;
          return (
            <>
                <UserEditor profile={p} onSave={save} onPassword={(pw) => changePassword(p, pw)} />
                {canAdjustWallet &&
              <WalletAdjuster
                userId={p.id}
                balance={Number(p.wallet_balance)}
                onAdjusted={(next) =>
                setRows((r) => r.map((x) => x.id === p.id ? { ...x, wallet_balance: next } : x))
                } />

              }
                <UserRegistrationDetails userId={p.id} phone={p.phone} />
                {p.role === "broker" && <BrokerEmployees brokerId={p.id} />}
              </>);

        })()}
        </div>
      }
    </div>);

}

function UserEditor({
  profile,
  onSave,
  onPassword




}: {profile: Profile;onSave: (p: Profile, patch: Partial<Profile>) => void;onPassword: (password: string) => void;}) {const { t } = useLanguage();
  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    phone: profile.phone ?? "",
    city: profile.city ?? "",
    role: profile.role,
    verification_status: profile.verification_status
  });
  const [password, setPassword] = useState("");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={adminInput}
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          placeholder={t("ui.full.name")} />
        
        <input
          className={adminInput}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder={t("ui.phone")} />
        
        <input
          className={adminInput}
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          placeholder={t("ui.city")} />
        
        <select
          className={adminInput}
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as AppRole })}>
          
          {(["employee", "employer", "broker", "kyc", "admin"] as const).map((r) =>
          <option key={r} value={r}>
              {roleLabels[r].en}
            </option>
          )}
        </select>
        <select
          className={adminInput}
          value={form.verification_status}
          onChange={(e) =>
          setForm({ ...form, verification_status: e.target.value as Profile["verification_status"] })
          }>
          
          {(["pending", "approved", "declined"] as const).map((s) =>
          <option key={s} value={s}>
              {s === "approved" ? "Verified" : s === "declined" ? "Declined" : "Pending"}
            </option>
          )}
        </select>
        <button
          onClick={() =>
          onSave(profile, {
            full_name: form.full_name,
            phone: form.phone,
            city: form.city,
            role: form.role,
            verification_status: form.verification_status,
            verified_at: form.verification_status === "approved" ? new Date().toISOString() : null
          })
          }
          className="btn-brand text-sm">{t("ui.save.user")}


        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-secondary/50 p-3">
        <input
          className={`${adminInput} max-w-xs`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("ui.set.a.new.password.min.8.characters")} />
        
        <button
          onClick={() => {
            onPassword(password);
            setPassword("");
          }}
          disabled={password.length < 8}
          className="btn-outline-brand text-xs disabled:opacity-50">{t("ui.reset.password")}


        </button>
      </div>
    </div>);

}

function BrokerEmployees({ brokerId }: {brokerId: string;}) {const { t } = useLanguage();
  const [rows, setRows] = useState<WorkerRow[]>([]);

  useEffect(() => {
    supabase.from("workers").select("*").eq("owner_id", brokerId).then(({ data }) => setRows(data ?? []));
  }, [brokerId]);

  async function toggle(w: WorkerRow) {
    const { error } = await supabase.from("workers").update({ available: !w.available }).eq("id", w.id);
    if (!error) setRows((r) => r.map((x) => x.id === w.id ? { ...x, available: !w.available } : x));
  }
  async function remove(id: string) {
    const { error } = await supabase.from("workers").delete().eq("id", id);
    if (!error) setRows((r) => r.filter((x) => x.id !== id));
  }

  return (
    <div className="mt-5 rounded-xl bg-secondary/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("ui.employees.under.this.broker")}

      </p>
      {rows.length === 0 ?
      <p className="mt-2 text-sm text-muted-foreground">{t("ui.no.employees.registered")}</p> :

      <div className="mt-2 space-y-2">
          {rows.map((w) =>
        <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-card p-3 text-sm">
              <span>
                <strong>{w.full_name}</strong> · {sectorLabel(w.sector)}
                {w.phone ? ` · ${w.phone}` : ""}
              </span>
              <span className="flex items-center gap-2">
                <VerifiedBadge status={w.verification_status} />
                <button onClick={() => toggle(w)} className="btn-outline-brand text-xs">
                  {w.available ? "Available" : "Not available"}
                </button>
                <button onClick={() => remove(w.id)} className="text-xs font-semibold text-destructive hover:underline">{t("ui.delete")}

            </button>
              </span>
            </div>
        )}
        </div>
      }
    </div>);

}
