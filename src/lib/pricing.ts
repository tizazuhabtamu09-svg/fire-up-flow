import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FEES } from "@/lib/app-config";
import { fetchActiveSubscription, feeOverrides } from "@/lib/subscriptions";

export type PricingKey = "booking" | "register_employee" | "pro_feature";

export const PRICING_FALLBACK: Record<PricingKey, number> = {
  booking: FEES.booking,
  register_employee: FEES.registerEmployee,
  pro_feature: FEES.proFeature,
};

export type PricingRow = { key: string; label: string; amount: number };

export async function fetchPricing(): Promise<Record<string, number>> {
  const { data } = await supabase.from("pricing_settings").select("key, amount, active");
  const map: Record<string, number> = { ...PRICING_FALLBACK };
  // A price switched off in the admin panel means the action is currently free.
  for (const row of data ?? []) map[row.key] = row.active === false ? 0 : Number(row.amount);
  return map;
}

/**
 * Admin-controlled fees, merged with the caller's subscription benefits when a
 * user id is given: a package fee override (e.g. free registrations) wins over
 * the base price, so subscribed users see — and are charged — their plan rate.
 */
export function usePricing(userId?: string) {
  const [prices, setPrices] = useState<Record<string, number>>({ ...PRICING_FALLBACK });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([fetchPricing(), userId ? fetchActiveSubscription(userId) : Promise.resolve(null)]).then(
      ([base, sub]) => {
        if (!active) return;
        setPrices({ ...base, ...feeOverrides(sub) });
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [userId]);

  return {
    prices,
    loading,
    fee: (key: PricingKey) => prices[key] ?? PRICING_FALLBACK[key],
  };
}

/** A plan card shown on public pages, sourced from admin-managed pricing. */
export type PublicPlan = {
  key: string;
  name: string;
  description: string | null;
  price: number;
  featured: boolean;
};

/**
 * Public plans, admin-controlled: subscription packages when the admin has
 * created any, otherwise the "subscription" rows from the pricing table.
 * Falls back to the static defaults while nothing is configured.
 */
export function usePublicPlans(fallback: PublicPlan[] = []) {
  const [plans, setPlans] = useState<PublicPlan[]>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: packages }, { data: rows }] = await Promise.all([
        supabase
          .from("subscription_packages")
          .select("id, name, description, price, active")
          .eq("active", true)
          .order("price"),
        supabase
          .from("pricing_settings")
          .select("key, label, amount, category, active")
          .eq("category", "subscription")
          .eq("active", true)
          .order("amount"),
      ]);
      if (!active) return;

      let next: PublicPlan[] = [];
      if (packages && packages.length > 0) {
        next = packages.map((p) => ({
          key: p.id,
          name: p.name,
          description: p.description,
          price: Number(p.price),
          featured: false,
        }));
      } else if (rows && rows.length > 0) {
        next = rows.map((r) => ({
          key: r.key,
          name: r.label,
          description: null,
          price: Number(r.amount),
          featured: false,
        }));
      }
      if (next.length > 0) {
        // Highlight the most expensive plan as the recommended one.
        const top = next.reduce((a, b) => (b.price > a.price ? b : a));
        next = next.map((p) => ({ ...p, featured: p.key === top.key }));
        setPlans(next);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { plans, loading };
}
