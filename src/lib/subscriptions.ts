import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SubscriptionPackage = Database["public"]["Tables"]["subscription_packages"]["Row"];
export type UserSubscription = Database["public"]["Tables"]["user_subscriptions"]["Row"];
/** A user subscription joined with its package definition. */
export type ActiveSubscription = UserSubscription & { package: SubscriptionPackage | null };

/** The user's current active, unexpired subscription (if any). */
export async function fetchActiveSubscription(userId: string): Promise<ActiveSubscription | null> {
  const { data } = await supabase
    .from("user_subscriptions")
    .select("*, package:subscription_packages(*)")
    .eq("user_id", userId)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as ActiveSubscription | null) ?? null;
}

export function useActiveSubscription(userId?: string) {
  const [subscription, setSubscription] = useState<ActiveSubscription | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    let active = true;
    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchActiveSubscription(userId).then((sub) => {
      if (!active) return;
      setSubscription(sub);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  return { subscription, loading };
}

function numericMap(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

/** Per-fee overrides granted by the subscription's package (e.g. { register_employee: 0 }). */
export function feeOverrides(sub: ActiveSubscription | null): Record<string, number> {
  return numericMap(sub?.package?.fee_overrides);
}

/** Feature limits granted by the package (e.g. { max_registrations: 10 }). */
export function featureLimits(sub: ActiveSubscription | null): Record<string, number> {
  return numericMap(sub?.package?.feature_limits);
}

export function daysLeft(sub: ActiveSubscription): number {
  return Math.max(0, Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86_400_000));
}

/**
 * Enforces the package's max_registrations feature limit. Returns a user-facing
 * error message when the broker has used up the allowance, otherwise null.
 */
export async function registrationLimitError(userId: string): Promise<string | null> {
  const sub = await fetchActiveSubscription(userId);
  if (!sub) return null;
  const limit = featureLimits(sub)["max_registrations"];
  if (typeof limit !== "number" || limit <= 0) return null;
  const { count } = await supabase
    .from("workers")
    .select("id", { count: "exact", head: true })
    .eq("registered_by", userId)
    .gte("created_at", sub.starts_at);
  if ((count ?? 0) >= limit) {
    return `Your ${sub.package?.name ?? "current"} plan allows ${limit} registrations per subscription period. Contact support to add more.`;
  }
  return null;
}

const FEE_LABELS: Record<string, string> = {
  register_employee: "employee registrations",
  booking: "bookings",
  pro_feature: "pro features",
};

/** Human-readable benefit lines for dashboards and admin summaries. */
export function benefitLines(sub: ActiveSubscription): string[] {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(feeOverrides(sub))) {
    if (value === 0) lines.push(`Free ${FEE_LABELS[key] ?? key.replaceAll("_", " ")}`);
  }
  const max = featureLimits(sub)["max_registrations"];
  if (typeof max === "number" && max > 0) lines.push(`Up to ${max} registrations per period`);
  return lines;
}
