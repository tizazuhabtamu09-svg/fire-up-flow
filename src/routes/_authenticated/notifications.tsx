import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BadgeCheck, Bell, CreditCard, ShieldAlert, Sparkles } from "lucide-react";
import { useSession } from "@/lib/use-session";
import { notifyExpiringSubscription, useNotifications, type NotificationRow } from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Agaze/አጋዝ" },
      { name: "description", content: "Your Agaze notifications: subscriptions, payments, verification and security updates." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsPage,
});

const ICONS: Record<string, typeof Bell> = {
  subscription: Sparkles,
  payment: CreditCard,
  verification: BadgeCheck,
  security: ShieldAlert,
  system: Bell,
};

function NotificationsPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const { items, loading, refresh, markRead, markAllRead } = useNotifications(user?.id);
  const hasUnread = items.some((n) => !n.read_at);

  // Lazily raises the "subscription ending soon" reminder, then refreshes.
  useEffect(() => {
    if (!user) return;
    notifyExpiringSubscription(user.id).then(refresh);
  }, [user, refresh]);

  function open(n: NotificationRow) {
    if (!n.read_at) markRead(n.id);
    if (n.link) navigate({ to: n.link });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="font-amharic text-muted-foreground">ማሳወቂያዎች</p>
        </div>
        {hasUnread && (
          <button onClick={markAllRead} className="btn-outline-brand text-sm">
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <p className="mt-8 text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="card-soft mt-8 p-10 text-center">
          <div className="text-4xl">🔔</div>
          <p className="mt-3 text-muted-foreground">
            No notifications yet. Subscription, payment, verification and security updates will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {items.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            return (
              <button
                key={n.id}
                onClick={() => open(n)}
                className={`card-soft flex w-full items-start gap-3 p-4 text-left transition hover:border-primary/40 ${
                  n.read_at ? "opacity-70" : ""
                }`}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold">{n.title}</span>
                    {!n.read_at && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />}
                  </span>
                  {n.body && <span className="mt-0.5 block text-sm text-muted-foreground">{n.body}</span>}
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
