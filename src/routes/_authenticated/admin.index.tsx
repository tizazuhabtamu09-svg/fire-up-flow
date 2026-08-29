import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money, sectorLabel, SECTORS } from "@/lib/app-config";
import type { AppRole } from "@/lib/use-session";
import { AdminSection, Metric } from "@/components/admin/shared";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type WorkerRow = Database["public"]["Tables"]["workers"]["Row"];
type Booking = Database["public"]["Tables"]["bookings"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    supabase.from("profiles").select("*").then(({ data }) => setProfiles(data ?? []));
    supabase.from("workers").select("*").then(({ data }) => setWorkers(data ?? []));
    supabase.from("bookings").select("*").then(({ data }) => setBookings(data ?? []));
    supabase.from("payments").select("*").then(({ data }) => setPayments(data ?? []));
  }, []);

  const byRole = (r: AppRole) => profiles.filter((p) => p.role === r).length;
  const approved = payments.filter((p) => p.status === "approved");
  const totalTopUps = approved.reduce((s, p) => s + Number(p.amount), 0);
  const walletTotal = profiles.reduce((s, p) => s + Number(p.wallet_balance), 0);
  const awaitingVerification =
    profiles.filter((p) => p.verification_status === "pending").length +
    workers.filter((w) => w.verification_status === "pending").length;

  const sectorCounts = SECTORS.map((s) => ({
    ...s,
    rows: workers.filter((w) => w.sector === s.value),
  })).filter((s) => s.rows.length > 0);

  return (
    <AdminSection title="Overview" description="Live numbers across accounts, verification, workers and money.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric to="/admin/users" label="Employees" value={byRole("employee")} />
        <Metric to="/admin/users" label="Employers" value={byRole("employer")} />
        <Metric to="/admin/users" label="Brokers" value={byRole("broker")} />
        <Metric to="/admin/sub-admins" label="KYC officers" value={byRole("kyc")} />
        <Metric to="/admin/verification" label="Awaiting verification" value={awaitingVerification} />
        <Metric to="/admin/workers" label="Registered workers" value={workers.length} />
        <Metric to="/admin/bookings" label="Pending bookings" value={bookings.filter((b) => b.status === "pending").length} />
        <Metric to="/admin/payments" label="Approved top-ups" value={money(totalTopUps)} />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Total wallet balance across all users: {money(walletTotal)}
      </p>

      <h2 className="mt-10 text-xl font-bold">Employees by sector</h2>
      <div className="mt-4 space-y-3">
        {sectorCounts.map((s) => (
          <details key={s.value} className="card-soft p-5">
            <summary className="cursor-pointer font-semibold">
              {s.label} <span className="font-amharic text-muted-foreground">{s.am}</span> · {s.rows.length}
            </summary>
            <div className="mt-3 space-y-2">
              {s.rows.map((w) => (
                <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary/50 p-3 text-sm">
                  <span>
                    <strong>{w.full_name}</strong>
                    {w.phone ? ` · ${w.phone}` : ""}
                    {w.city ? ` · ${w.city}` : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {sectorLabel(w.sector)} · {w.verification_status}
                  </span>
                </div>
              ))}
            </div>
          </details>
        ))}
        {sectorCounts.length === 0 && <p className="text-muted-foreground">No workers registered yet.</p>}
      </div>
    </AdminSection>
  );
}
