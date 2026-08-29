import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/app-config";
import { AdminSection } from "@/components/admin/shared";
import { useLanguage } from "@/lib/i18n";
import type { Database } from "@/integrations/supabase/types";

type Payment = Database["public"]["Tables"]["payments"]["Row"];

export const Route = createFileRoute("/_authenticated/admin/payments")({
  component: AdminPayments,
});

function AdminPayments() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    supabase.from("payments").select("*").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  }, []);

  async function approve(p: Payment) {
    setBusy(p.id);
    setError(null);
    const { error: err } = await supabase.rpc("approve_payment", { _payment_id: p.id });
    setBusy(null);
    if (err) return setError(err.message);
    setRows((r) => r.map((x) => (x.id === p.id ? { ...x, status: "approved" } : x)));
  }

  async function reject(p: Payment) {
    const { error: err } = await supabase
      .from("payments")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", p.id);
    if (!err) setRows((r) => r.map((x) => (x.id === p.id ? { ...x, status: "rejected" } : x)));
  }

  async function viewReceipt(path: string) {
    const { data } = await supabase.storage.from("receipts").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <AdminSection title={t("admin.payments.title")} description={t("admin.payments.description")}>
      <div className="space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {rows.map((p) => (
          <div key={p.id} className="card-soft flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="font-semibold">{money(p.amount)} — {p.payer_name}</p>
              <p className="text-sm text-muted-foreground">
                {p.purpose ?? t("admin.payments.recharge")} · {new Date(p.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold capitalize">{p.status}</span>
              {p.receipt_path && (
                <button onClick={() => viewReceipt(p.receipt_path!)} className="btn-outline-brand text-xs">{t("admin.payments.viewReceipt")}</button>
              )}
              {p.status === "pending" && (
                <>
                  <button disabled={busy === p.id} onClick={() => approve(p)} className="btn-brand text-xs disabled:opacity-60">
                    {busy === p.id ? t("admin.payments.approving") : t("admin.payments.approve")}
                  </button>
                  <button onClick={() => reject(p)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-destructive hover:underline">{t("admin.payments.reject")}</button>
                </>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground">{t("admin.payments.empty")}</p>}
      </div>
    </AdminSection>
  );
}
