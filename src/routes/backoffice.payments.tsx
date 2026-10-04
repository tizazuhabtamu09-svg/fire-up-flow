import { useLanguage } from "@/lib/i18n";import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/app-config";
import { AdminSection } from "@/components/admin/shared";
import { staffCan, useStaff } from "@/components/backoffice/context";
import type { Database } from "@/integrations/supabase/types";

type Payment = Database["public"]["Tables"]["payments"]["Row"];

export const Route = createFileRoute("/backoffice/payments")({
  component: BackofficePayments
});

function BackofficePayments() {const { t } = useLanguage();
  const staff = useStaff();
  const allowed = staffCan(staff, "payments");
  const [rows, setRows] = useState<Payment[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    supabase.
    from("payments").
    select("*").
    order("created_at", { ascending: false }).
    then(({ data }) => setRows(data ?? []));
  }, [allowed]);

  if (!allowed) {
    return (
      <AdminSection title={t("ui.incoming.payments")} description="You don't have the payments permission. Ask an admin to grant it.">
        <p className="text-muted-foreground">{t("ui.access.restricted")}</p>
      </AdminSection>);

  }

  async function approve(p: Payment) {
    setBusy(p.id);
    setError(null);
    const { error: err } = await supabase.rpc("approve_payment", { _payment_id: p.id });
    setBusy(null);
    if (err) return setError(err.message);
    setRows((r) => r.map((x) => x.id === p.id ? { ...x, status: "approved" } : x));
  }

  async function reject(p: Payment) {
    const { error: err } = await supabase.
    from("payments").
    update({ status: "rejected", reviewed_at: new Date().toISOString() }).
    eq("id", p.id);
    if (err) return setError(err.message);
    setRows((r) => r.map((x) => x.id === p.id ? { ...x, status: "rejected" } : x));
  }

  async function viewReceipt(path: string) {
    const { data } = await supabase.storage.from("receipts").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <AdminSection title={t("ui.incoming.payments")} description="Approve a payment to credit the user's wallet instantly.">
      <div className="space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {rows.map((p) =>
        <div key={p.id} className="card-soft flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="font-semibold">{money(p.amount)} — {p.payer_name}</p>
              <p className="text-sm text-muted-foreground">
                {p.purpose ?? "recharge"} · {new Date(p.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold capitalize">{p.status}</span>
              {p.receipt_path &&
            <button onClick={() => viewReceipt(p.receipt_path!)} className="btn-outline-brand text-xs">{t("ui.view.receipt")}</button>
            }
              {p.status === "pending" &&
            <>
                  <button disabled={busy === p.id} onClick={() => approve(p)} className="btn-brand text-xs disabled:opacity-60">
                    {busy === p.id ? "Approving…" : "Approve"}
                  </button>
                  <button onClick={() => reject(p)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-destructive hover:underline">{t("ui.reject")}</button>
                </>
            }
            </div>
          </div>
        )}
        {rows.length === 0 && <p className="text-muted-foreground">{t("ui.no.incoming.payments")}</p>}
      </div>
    </AdminSection>);

}
