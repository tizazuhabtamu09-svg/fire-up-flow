import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/app-config";
import { adminInput } from "@/components/admin/shared";
import { useLanguage } from "@/lib/i18n";

/**
 * Primary-admin only: manually credit or debit a user's wallet. Every change is
 * written through `admin_adjust_wallet`, which requires an audit note and logs
 * the acting admin against the transaction.
 */
export function WalletAdjuster({
  userId,
  balance,
  onAdjusted,
}: {
  userId: string;
  balance: number;
  onAdjusted: (newBalance: number) => void;
}) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function adjust(sign: 1 | -1) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return setError(t("admin.wallet.errorAmount"));
    if (!note.trim()) return setError(t("admin.wallet.errorNote"));
    setBusy(true);
    setError(null);
    setStatus(null);
    const { data, error: err } = await supabase.rpc("admin_adjust_wallet", {
      _user_id: userId,
      _amount: value * sign,
      _note: note.trim(),
    });
    setBusy(false);
    if (err) return setError(err.message);
    const next = Number(data);
    onAdjusted(next);
    setAmount("");
    setNote("");
    setStatus(t("admin.wallet.updated", { balance: money(next) }));
  }

  return (
    <div className="mt-5 rounded-xl bg-secondary/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("admin.wallet.overrideTitle", { balance: money(balance) })}
      </p>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {status && <p className="mt-2 text-sm text-primary">{status}</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input
          className={adminInput}
          type="number"
          min="0"
          placeholder={t("admin.wallet.amountPlaceholder")}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          className={adminInput}
          placeholder={t("admin.wallet.notePlaceholder")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex gap-2 sm:col-span-2">
          <button disabled={busy} onClick={() => adjust(1)} className="btn-brand text-xs disabled:opacity-60">
            {t("admin.wallet.credit")}
          </button>
          <button disabled={busy} onClick={() => adjust(-1)} className="btn-outline-brand text-xs disabled:opacity-60">
            {t("admin.wallet.debit")}
          </button>
        </div>
      </div>
    </div>
  );
}
