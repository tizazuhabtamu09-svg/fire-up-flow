import { useLanguage } from "@/lib/i18n";import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/app-config";
import { AdminSection, adminInput } from "@/components/admin/shared";
import { SubscriptionManager } from "@/components/admin/SubscriptionManager";
import { staffCan, useStaff } from "@/components/backoffice/context";
import type { Database } from "@/integrations/supabase/types";

type Pricing = Database["public"]["Tables"]["pricing_settings"]["Row"];

export const Route = createFileRoute("/backoffice/pricing")({
  component: BackofficePricing
});

const CATEGORIES = [
{ value: "fees", label: "Service fees" },
{ value: "broker", label: "Broker fees" },
{ value: "pro", label: "Pro feature rates" },
{ value: "subscription", label: "Subscription types" },
{ value: "general", label: "General" }];


/** Known categories plus any extra category found in the saved prices, so no row is ever hidden. */
function allCategories(rows: {category: string | null;}[]) {
  const extra = [...new Set(rows.map((r) => r.category ?? "general"))].
  filter((c) => !CATEGORIES.some((k) => k.value === c)).
  map((c) => ({ value: c, label: c.replace(/_/g, " ") }));
  return [...CATEGORIES, ...extra];
}

function BackofficePricing() {const { t } = useLanguage();
  const staff = useStaff();
  const allowed = staffCan(staff, "pricing");
  const [rows, setRows] = useState<Pricing[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [labelDraft, setLabelDraft] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ key: "", label: "", amount: "", category: "subscription" });

  const load = useCallback(() => {
    supabase.
    from("pricing_settings").
    select("*").
    order("category").
    order("label").
    then(({ data }) => setRows(data ?? []));
  }, []);
  useEffect(load, [load]);

  if (!allowed) {
    return (
      <AdminSection title={t("ui.pricing")} description="You don't have the pricing permission. Ask an admin to grant it.">
        <p className="text-muted-foreground">{t("ui.access.restricted")}</p>
      </AdminSection>);

  }

  async function save(row: Pricing) {
    const amount = Number(draft[row.key] ?? row.amount);
    if (!Number.isFinite(amount) || amount < 0) return setError("Enter a valid amount.");
    const label = (labelDraft[row.key] ?? row.label).trim();
    if (!label) return setError("A name is required.");
    setError(null);
    const { error: err } = await supabase.from("pricing_settings").update({ amount, label }).eq("key", row.key);
    if (err) return setError(err.message);
    setRows((r) => r.map((x) => x.key === row.key ? { ...x, amount, label } : x));
    setStatus(`${label} updated.`);
  }

  async function toggleActive(row: Pricing) {
    const active = !(row.active ?? true);
    const { error: err } = await supabase.from("pricing_settings").update({ active }).eq("key", row.key);
    if (err) return setError(err.message);
    setRows((r) => r.map((x) => x.key === row.key ? { ...x, active } : x));
    setStatus(`${row.label} is now ${active ? "charged" : "free"}.`);
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const key = newItem.key.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
    if (!key || !newItem.label.trim()) return setError("A key and a label are required.");
    const { error: err } = await supabase.from("pricing_settings").insert({
      key,
      label: newItem.label.trim(),
      amount: Number(newItem.amount) || 0,
      category: newItem.category
    });
    if (err) return setError(err.message);
    setNewItem({ key: "", label: "", amount: "", category: "subscription" });
    setStatus("Price added.");
    load();
  }

  async function remove(key: string) {
    const { error: err } = await supabase.from("pricing_settings").delete().eq("key", key);
    if (err) return setError(err.message);
    setRows((r) => r.filter((x) => x.key !== key));
  }

  return (
    <AdminSection title={t("ui.pricing")} description="Set broker fees, pro feature rates and subscription plans. Changes apply across the app immediately.">
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      {status && <p className="mb-4 text-sm text-primary">{status}</p>}

      <div className="space-y-8">
        {allCategories(rows).map((cat) => {
          const items = rows.filter((r) => (r.category ?? "general") === cat.value);
          if (items.length === 0) return null;
          return (
            <div key={cat.value}>
              <h2 className="text-lg font-bold">{cat.label}</h2>
              <div className="mt-3 space-y-3">
                {items.map((row) =>
                <div key={row.key} className="card-soft flex flex-wrap items-center justify-between gap-3 p-5">
                    <div>
                      <p className="font-semibold">
                        {row.label}
                        {row.active === false &&
                      <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">{t("ui.off.free")}

                      </span>
                      }
                      </p>
                      <p className="text-xs text-muted-foreground">{row.key}{t("ui.currently")}{money(row.amount)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                      className="w-48 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                      defaultValue={row.label}
                      onChange={(e) => setLabelDraft({ ...labelDraft, [row.key]: e.target.value })} />
                    
                      <input
                      type="number"
                      className="w-32 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                      defaultValue={row.amount}
                      onChange={(e) => setDraft({ ...draft, [row.key]: e.target.value })} />
                    
                      <button onClick={() => save(row)} className="btn-brand text-xs">{t("ui.save")}</button>
                      <button onClick={() => toggleActive(row)} className="btn-outline-brand text-xs">
                        {row.active === false ? "Enable" : "Disable"}
                      </button>
                      <button onClick={() => remove(row.key)} className="text-xs font-semibold text-destructive hover:underline">{t("ui.delete")}</button>
                    </div>
                  </div>

                )}
              </div>
            </div>);

        })}
        {rows.length === 0 && <p className="text-muted-foreground">{t("ui.no.prices.configured.yet")}</p>}
      </div>

      <form onSubmit={addItem} className="card-soft mt-10 grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="text-lg font-bold sm:col-span-2">{t("ui.add.a.price.or.subscription.type")}</h2>
        <input className={adminInput} placeholder={t("ui.key.e.g.subscription.gold")} value={newItem.key} onChange={(e) => setNewItem({ ...newItem, key: e.target.value })} />
        <input className={adminInput} placeholder={t("ui.label.shown.to.users")} value={newItem.label} onChange={(e) => setNewItem({ ...newItem, label: e.target.value })} />
        <input className={adminInput} type="number" placeholder={t("ui.amount.in.etb")} value={newItem.amount} onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })} />
        <select className={adminInput} value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
          {CATEGORIES.map((c) =>
          <option key={c.value} value={c.value}>{c.label}</option>
          )}
        </select>
        <button className="btn-brand text-sm sm:col-span-2">{t("ui.add.price")}</button>
      </form>

      <div className="mt-12 border-t border-border/60 pt-8">
        <SubscriptionManager />
      </div>
    </AdminSection>);

}
