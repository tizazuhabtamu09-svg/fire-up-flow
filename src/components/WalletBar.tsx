import { useLanguage } from "@/lib/i18n";import { Link } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { money } from "@/lib/app-config";
import { useSession } from "@/lib/use-session";
import { useWalletAccess } from "@/lib/wallet-access";

export function WalletBar({ balance }: {balance: number | null | undefined;}) {const { t } = useLanguage();
  const { user } = useSession();
  const { loading, canUseWallet } = useWalletAccess(user?.id);

  // Wallet features are hidden entirely for admin, sub-admin and KYC roles.
  if (loading || !canUseWallet) return null;

  return (
    <div className="card-soft mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}>
          
          <Wallet className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("ui.wallet.balance")}</p>
          <p className="text-2xl font-bold">{money(balance)}</p>
          <p className="font-amharic text-xs text-muted-foreground">የቦርሳ ቀሪ ሂሳብ</p>
        </div>
      </div>
      <Link to="/payment" search={{ purpose: "recharge", amount: 0 }} className="btn-brand text-sm">{t("ui.recharge")}

      </Link>
    </div>);

}
