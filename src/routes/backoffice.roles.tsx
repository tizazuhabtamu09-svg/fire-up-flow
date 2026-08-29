import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminSection, adminInput } from "@/components/admin/shared";
import { CreateStaffPanel } from "@/components/admin/CreateStaffForms";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useStaff } from "@/components/backoffice/context";
import { roleLabels, type VerificationStatus } from "@/lib/use-session";

export const Route = createFileRoute("/backoffice/roles")({
  component: RolesManager,
});

const PERMISSIONS = [
  { key: "users", label: "Manage users" },
  { key: "verification", label: "Verify documents" },
  { key: "pricing", label: "Manage pricing" },
  { key: "payments", label: "Review payments" },
  { key: "bookings", label: "Manage bookings" },
];

type SubAdmin = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  active: boolean;
  permissions: Record<string, boolean> | null;
};

type Account = {
  id: string;
  full_name: string | null;
  role: string;
  city: string | null;
  phone: string | null;
  verification_status: VerificationStatus;
};

function RolesManager() {
  const staff = useStaff();
  const navigate = useNavigate();
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!staff.isAdmin) navigate({ to: "/access-denied", replace: true });
  }, [staff.isAdmin, navigate]);

  const load = useCallback(async () => {
    const [subs, profiles] = await Promise.all([
      supabase.from("sub_admins").select("id, full_name, email, phone, city, active, permissions").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, role, city, phone, verification_status").order("created_at", { ascending: false }),
    ]);
    setSubAdmins((subs.data ?? []) as SubAdmin[]);
    setAccounts((profiles.data ?? []) as Account[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function togglePermission(sub: SubAdmin, key: string, value: boolean) {
    const next = { ...(sub.permissions ?? {}), [key]: value };
    setSubAdmins((all) => all.map((s) => (s.id === sub.id ? { ...s, permissions: next } : s)));
    const { error: err } = await supabase.from("sub_admins").update({ permissions: next }).eq("id", sub.id);
    if (err) setError(err.message);
  }

  async function toggleActive(sub: SubAdmin) {
    const next = !sub.active;
    setSubAdmins((all) => all.map((s) => (s.id === sub.id ? { ...s, active: next } : s)));
    const { error: err } = await supabase.from("sub_admins").update({ active: next }).eq("id", sub.id);
    if (err) setError(err.message);
  }

  async function setAccountStatus(account: Account, status: VerificationStatus) {
    setAccounts((all) => all.map((a) => (a.id === account.id ? { ...a, verification_status: status } : a)));
    const { error: err } = await supabase
      .from("profiles")
      .update({
        verification_status: status,
        verified_at: status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", account.id);
    if (err) setError(err.message);
  }

  const shownAccounts = accounts.filter(
    (a) => q.trim() === "" || (a.full_name ?? "").toLowerCase().includes(q.trim().toLowerCase()),
  );

  if (!staff.isAdmin) return null;

  return (
    <AdminSection
      title="Roles & permissions"
      description="Create staff accounts, tune sub-admin permissions and oversee the status of every user account."
    >
      {error && <p className="text-sm text-destructive">{error}</p>}

      <h2 className="text-lg font-bold">Sub-admins</h2>
      <div className="mt-3 space-y-3">
        {subAdmins.map((sub) => (
          <div key={sub.id} className="card-soft p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{sub.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {sub.email}
                  {sub.phone ? ` · ${sub.phone}` : ""}
                  {sub.city ? ` · ${sub.city}` : ""}
                </p>
              </div>
              <button onClick={() => toggleActive(sub)} className="btn-outline-brand text-xs">
                {sub.active ? "Deactivate" : "Activate"}
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {PERMISSIONS.map((p) => (
                <label key={p.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(sub.permissions?.[p.key])}
                    onChange={(e) => togglePermission(sub, p.key, e.target.checked)}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
        ))}
        {subAdmins.length === 0 && <p className="text-muted-foreground">No sub-admins yet.</p>}
      </div>

      <CreateStaffPanel onCreated={load} />

      <div className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">User accounts</h2>
          <input className={`${adminInput} max-w-xs`} placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="card-soft mt-3 divide-y divide-border">
          {shownAccounts.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  {a.full_name || "Unnamed user"} <VerifiedBadge status={a.verification_status} />
                </p>
                <p className="text-sm text-muted-foreground">
                  {roleLabels[a.role as keyof typeof roleLabels]?.en ?? a.role}
                  {a.phone ? ` · ${a.phone}` : ""}
                  {a.city ? ` · ${a.city}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAccountStatus(a, "approved")} className="btn-brand text-xs">Approve</button>
                <button onClick={() => setAccountStatus(a, "declined")} className="btn-outline-brand text-xs">Suspend</button>
              </div>
            </div>
          ))}
          {shownAccounts.length === 0 && <p className="p-4 text-muted-foreground">No accounts match that search.</p>}
        </div>
      </div>
    </AdminSection>
  );
}
