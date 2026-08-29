import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useProfile } from "@/lib/use-session";
import { loadAvailableEmployees, type EmployeeCard } from "@/lib/employees";
import { money } from "@/lib/app-config";
import { usePricing } from "@/lib/pricing";
import { WalletBar } from "@/components/WalletBar";
import { useLanguage } from "@/lib/i18n";
import type { Database } from "@/integrations/supabase/types";

type Booking = Database["public"]["Tables"]["bookings"]["Row"];

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({
    meta: [
      { title: "My bookings — Agaze/አጋዝ" },
      { name: "description", content: "Manage your Agaze bookings: schedule, status and history." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookingsPage,
});

const services = ["All in One", "House Cleaning", "Babysitting", "Cooking", "Waitstaff"];
const cls = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:border-primary";

function BookingsPage() {
  const { t } = useLanguage();
  const { user } = useSession();
  const { profile } = useProfile(user?.id);
  // Pricing is subscription-aware: a plan's fee override (e.g. free bookings) wins.
  const { fee } = usePricing(user?.id);
  const bookingFee = fee("booking");
  const isWorker = profile?.role === "employee";
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pool, setPool] = useState<EmployeeCard[]>([]);

  useEffect(() => {
    loadAvailableEmployees().then(setPool);
  }, []);

  const [form, setForm] = useState({
    worker_name: "",
    service: services[0],
    scheduled_date: "",
    hours: "4",
    address: "",
    notes: "",
  });

  useEffect(() => {
    if (!user) return;
    const col = isWorker ? "worker_id" : "employer_id";
    supabase
      .from("bookings")
      .select("*")
      .eq(col, user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setBookings(data ?? []);
        setLoading(false);
      });
  }, [user, isWorker]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    // Wallet charge is skipped entirely when the plan waives the booking fee.
    if (bookingFee > 0) {
      const { error: feeErr } = await supabase.rpc("spend_wallet", {
        _amount: bookingFee,
        _reason: `Booking request: ${form.service}`,
      });
      if (feeErr) {
        setError(
          feeErr.message.includes("Insufficient")
            ? t("book.insufficientBalance")
            : feeErr.message,
        );
        setSaving(false);
        return;
      }
    }
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        employer_id: user.id,
        worker_name: form.worker_name || null,
        service: form.service,
        scheduled_date: form.scheduled_date || null,
        hours: form.hours ? Number(form.hours) : null,
        address: form.address || null,
        notes: form.notes || null,
      })
      .select()
      .single();
    if (error) setError(error.message);
    else {
      setBookings((b) => [data, ...b]);
      setOpen(false);
      setForm({ worker_name: "", service: services[0], scheduled_date: "", hours: "4", address: "", notes: "" });
    }
    setSaving(false);
  }

  async function cancel(id: string) {
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (!error) setBookings((b) => b.map((x) => (x.id === id ? { ...x, status: "cancelled" } : x)));
  }

  return (
    <div>
      <WalletBar balance={profile?.wallet_balance} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("book.title")}</h1>
          <p className="font-amharic text-muted-foreground">ቀጠሮዎች</p>
        </div>
        {!isWorker && (
          <button onClick={() => setOpen((v) => !v)} className="btn-brand text-sm">
            {open ? t("book.close") : t("book.newBooking")}
          </button>
        )}
      </div>

      {open && !isWorker && (
        <form onSubmit={create} className="card-soft mt-6 space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">{t("book.worker")}</span>
              <select value={form.worker_name} onChange={(e) => setForm({ ...form, worker_name: e.target.value })} className={cls}>
                <option value="">{t("book.anyAvailable")}</option>
                {pool.map((w) => (
                  <option key={w.id} value={w.name}>{w.name} — {w.role}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">{t("book.service")}</span>
              <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className={cls}>
                {services.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">{t("book.date")}</span>
              <input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} className={cls} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">{t("book.hoursPerDay")}</span>
              <input type="number" min={1} max={12} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className={cls} />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium">{t("book.address")}</span>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={cls} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">{t("book.notes")}</span>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={cls} />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">
            {bookingFee > 0 ? t("book.feeNote", { amount: money(bookingFee) }) : t("book.feeFree")}
          </p>
          <button disabled={saving} className="btn-brand w-full disabled:opacity-60">{saving ? t("book.saving") : t("book.requestBooking")}</button>
        </form>
      )}

      {loading ? (
        <p className="mt-8 text-muted-foreground">{t("common.loading")}</p>
      ) : bookings.length === 0 ? (
        <div className="card-soft mt-8 p-10 text-center text-muted-foreground">{t("book.noBookings")}</div>
      ) : (
        <div className="mt-8 space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="card-soft flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-semibold">{b.service}</p>
                <p className="text-sm text-muted-foreground">
                  {b.worker_name ? `${b.worker_name} · ` : ""}
                  {b.scheduled_date ?? t("dash.dateToConfirm")}
                  {b.hours ? ` · ${b.hours}h/day` : ""}
                </p>
                {b.address && <p className="text-sm text-muted-foreground">{b.address}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold capitalize">{b.status}</span>
                {!isWorker && (b.status === "pending" || b.status === "accepted") && (
                  <button onClick={() => cancel(b.id)} className="btn-outline-brand text-xs">{t("book.cancel")}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
