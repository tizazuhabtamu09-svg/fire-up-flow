import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { daysLeft, fetchActiveSubscription } from "@/lib/subscriptions";

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationType = "subscription" | "payment" | "verification" | "security" | "system";

/** Live unread badge count for the header bell (lightweight polling). */
export function useUnreadCount(userId?: string, pollMs = 30_000) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!userId) {
      setUnread(0);
      return;
    }
    let active = true;
    const load = () =>
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null)
        .then(({ count }) => {
          if (active) setUnread(count ?? 0);
        });
    load();
    const iv = setInterval(load, pollMs);
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, [userId, pollMs]);

  return unread;
}

/** The user's notification feed with read-state actions. */
export function useNotifications(userId?: string) {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    setItems(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: string) {
    const now = new Date().toISOString();
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read_at: now } : n)));
    await supabase.from("notifications").update({ read_at: now }).eq("id", id);
  }

  async function markAllRead() {
    if (!userId) return;
    const now = new Date().toISOString();
    setItems((list) => list.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    await supabase.from("notifications").update({ read_at: now }).eq("user_id", userId).is("read_at", null);
  }

  return { items, loading, refresh: load, markRead, markAllRead };
}

/**
 * Lazily creates a "subscription ending soon" reminder once per subscription
 * period (the database triggers cover starts/changes; expiry needs no cron).
 */
export async function notifyExpiringSubscription(userId: string) {
  const sub = await fetchActiveSubscription(userId);
  if (!sub) return;
  const left = daysLeft(sub);
  if (left > 5) return;
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", "subscription")
    .eq("title", "Subscription ending soon")
    .gte("created_at", sub.starts_at);
  if (count) return;
  await supabase.from("notifications").insert({
    user_id: userId,
    type: "subscription",
    title: "Subscription ending soon",
    body: `${sub.package?.name ?? "Your plan"} expires in ${left} day${left === 1 ? "" : "s"}. Renew to keep your benefits.`,
    link: "/dashboard",
  });
}

/** Security-event notification, e.g. after a password change. */
export async function pushSecurityNotification(userId: string, title: string, body: string) {
  await supabase.from("notifications").insert({
    user_id: userId,
    type: "security",
    title,
    body,
    link: "/profile",
  });
}
