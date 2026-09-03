import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { CONTACT, money } from "@/lib/app-config";
import { useLanguage } from "@/lib/i18n";
import { FileUpload } from "@/components/FileUpload";

type Search = { purpose?: string; amount?: number; package?: string; job?: string };

export const Route = createFileRoute("/_authenticated/payment")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    purpose: typeof s['purpose'] === "string" ? s['purpose'] : "recharge",
    amount: Number(s['amount']) > 0 ? Number(s['amount']) : 0,
    package: typeof s['package'] === "string" ? s['package'] : undefined,
    job: typeof s['job'] === "string" ? s['job'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Payment — Agaze/አጋዝ" },
      { name: "description", content: "Send your Telebirr payment and upload the receipt for admin approval." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaymentPage,
});

const cls = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:border-primary";

function PaymentPage() {
  const { t } = useLanguage();
  const { purpose, amount: presetAmount, package: packageId, job: jobId } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useSession();
  const [amount, setAmount] = useState(presetAmount ? String(presetAmount) : "");
  const [payerName, setPayerName] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [showBank, setShowBank] = useState(false);

  // Wallet balance decides which payment method is offered first.
  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("profiles")
      .select("wallet_balance, full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return;
        setBalance(Number(data.wallet_balance));
        setPayerName((n) => n || (data.full_name ?? ""));
      });
    return () => {
      active = false;
    };
  }, [user]);

  const due = Number(amount) || 0;
  // Recharging tops the wallet up, so it can never be paid from the wallet itself.
  const walletEligible = (purpose ?? "recharge") !== "recharge" && due > 0;
  const hasFunds = balance !== null && balance >= due;

  /** Deduct the fee straight from the wallet and settle the payment immediately. */
  async function payFromWallet() {
    if (!user || !walletEligible) return;
    setSaving(true);
    setError(null);
    const { data: newBalance, error: rpcErr } = await supabase.rpc("spend_wallet", {
      _amount: due,
      _reason: purpose ?? "Wallet payment",
    });
    if (rpcErr) {
      setSaving(false);
      return setError(rpcErr.message);
    }
    setBalance(Number(newBalance));

    const { data: payment, error: insErr } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        amount: due,
        payer_name: payerName.trim() || "Wallet",
        purpose: purpose ?? "wallet",
        package_id: packageId ?? null,
        method: "wallet",
        status: "approved",
        reviewed_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle();

    if (!insErr && jobId) {
      await supabase
        .from("job_posts")
        .update({ status: "pending_approval", payment_id: payment?.id ?? null })
        .eq("id", jobId)
        .eq("status", "awaiting_payment");
    }

    setSaving(false);
    if (insErr) setError(insErr.message);
    else setDone(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const value = Number(amount);
    if (!value || value <= 0) return setError(t("pay.enterValidAmount"));
    if (!payerName.trim()) return setError(t("pay.enterPayerName"));
    setSaving(true);
    setError(null);

    let receiptPath: string | null = null;
    if (receipt) {
      const ext = receipt.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("receipts").upload(path, receipt);
      if (upErr) {
        setError(upErr.message);
        setSaving(false);
        return;
      }
      receiptPath = path;
    }

    const { data: payment, error: insErr } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        amount: value,
        payer_name: payerName.trim(),
        receipt_path: receiptPath,
        purpose: purpose ?? "recharge",
        package_id: packageId ?? null,
        method: "bank",
      })
      .select("id")
      .maybeSingle();

    // A paid job post moves straight into the staff approval queue.
    if (!insErr && jobId) {
      await supabase
        .from("job_posts")
        .update({ status: "pending_approval", payment_id: payment?.id ?? null })
        .eq("id", jobId)
        .eq("status", "awaiting_payment");
    }

    setSaving(false);
    if (insErr) setError(insErr.message);
    else setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="card-soft p-10 text-center">
          <div className="text-4xl">✅</div>
          <h1 className="mt-3 text-2xl font-bold">{t("pay.submittedTitle")}</h1>
          <p className="font-amharic text-muted-foreground">ክፍያዎ ተልኳል</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("pay.submittedNote", { amount: money(Number(amount)) })}
          </p>
          <button onClick={() => navigate({ to: "/dashboard" })} className="btn-brand mt-6">
            {t("pay.backToDashboard")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-3xl font-bold">{t("pay.title")}</h1>
      <p className="font-amharic text-muted-foreground">ክፍያ</p>

      {walletEligible && (
        <div className="card-soft mt-6 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pay from wallet</p>
          <p className="mt-2 text-sm">
            Amount due <span className="font-bold">{money(due)}</span> · Balance{" "}
            <span className="font-bold">{balance === null ? "…" : money(balance)}</span>
          </p>
          <button
            type="button"
            onClick={payFromWallet}
            disabled={saving || !hasFunds}
            className="btn-brand mt-4 w-full disabled:opacity-60"
          >
            {saving ? "Processing…" : `Pay ${money(due)} from wallet`}
          </button>
          {!hasFunds && balance !== null && (
            <p className="mt-2 text-xs text-destructive">
              Not enough balance. Top up your wallet or pay by bank / Telebirr below.
            </p>
          )}
          <button
            type="button"
            onClick={() => setShowBank((v) => !v)}
            className="mt-3 w-full text-center text-xs font-semibold text-primary hover:underline"
          >
            {showBank ? "Hide bank / Telebirr payment" : "Pay by bank / Telebirr instead (optional)"}
          </button>
          {error && !showBank && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
      )}

      {(!walletEligible || showBank) && (
      <>
      <div className="card-soft mt-6 p-6" style={{ background: "var(--brand-soft)" }}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("pay.sendTo")}</p>
        <p className="mt-2 text-lg font-bold">{CONTACT.accountName}</p>
        <p className="text-sm">
          Telebirr: <span className="font-semibold">{CONTACT.telebirr}</span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{t("pay.afterSendingNote")}</p>
      </div>

      <form onSubmit={submit} className="card-soft mt-6 space-y-5 p-6">
        <label className="block">
          <span className="text-sm font-medium">{t("pay.amount")}</span>
          <input type="number" min={1} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={cls} required />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t("pay.payerName")}</span>
          <input value={payerName} onChange={(e) => setPayerName(e.target.value)} className={cls} required />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t("pay.receipt")}</span>
          <div className="mt-1">
            <FileUpload file={receipt} onFile={setReceipt} accept="image/*,application/pdf" />
          </div>
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button disabled={saving} className="btn-brand w-full disabled:opacity-60">
          {saving ? t("pay.submitting") : t("pay.submitPayment")}
        </button>
      </form>
      </>
      )}
    </div>
  );
}
