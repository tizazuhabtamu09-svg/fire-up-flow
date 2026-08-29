import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useUnreadCount } from "@/lib/notifications";
import { useLanguage } from "@/lib/i18n";

/** Header bell linking to the notification feed, with an unread badge. */
export function NotificationsBell({ userId, className }: { userId?: string; className?: string }) {
  const { t } = useLanguage();
  const unread = useUnreadCount(userId);
  return (
    <Link
      to="/notifications"
      aria-label={t("nav.notifications")}
      className={
        className ??
        "relative hidden h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-foreground md:inline-flex"
      }
    >
      <Bell className="h-4 w-4" />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
