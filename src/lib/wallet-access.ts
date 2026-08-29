import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchStaffAccess } from "@/lib/onboarding";

export type WalletAccess = {
  loading: boolean;
  /** Standard users only. Admin, sub-admin and KYC officers never see wallet UI. */
  canUseWallet: boolean;
  /** Primary admin: the only role allowed to credit/debit other people's wallets. */
  isSuperAdmin: boolean;
  balance: number | null;
};

/**
 * Wallet visibility rules in one place:
 * - standard users (employee / employer / broker) see their own balance & history
 * - admin, sub-admin and KYC officers get no wallet UI at all
 * - only the primary admin can adjust someone else's balance
 */
export function useWalletAccess(userId: string | undefined): WalletAccess {
  const [state, setState] = useState<WalletAccess>({
    loading: true,
    canUseWallet: false,
    isSuperAdmin: false,
    balance: null,
  });

  useEffect(() => {
    let active = true;
    if (!userId) {
      setState({ loading: false, canUseWallet: false, isSuperAdmin: false, balance: null });
      return;
    }
    (async () => {
      const staff = await fetchStaffAccess(userId);
      const { data } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("id", userId)
        .maybeSingle();
      if (!active) return;
      setState({
        loading: false,
        canUseWallet: !staff.isStaff,
        isSuperAdmin: staff.isAdmin,
        balance: data ? Number(data.wallet_balance) : null,
      });
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  return state;
}
