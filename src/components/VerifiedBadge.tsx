import { BadgeCheck, Clock, ShieldX } from "lucide-react";
import type { VerificationStatus } from "@/lib/use-session";

const MAP: Record<VerificationStatus, { label: string; am: string; className: string }> = {
  approved: { label: "Verified", am: "የተረጋገጠ", className: "bg-primary/15 text-primary" },
  pending: { label: "Pending verification", am: "በመጠባበቅ ላይ", className: "bg-secondary text-muted-foreground" },
  declined: { label: "Verification declined", am: "ተቀባይነት አላገኘም", className: "bg-destructive/10 text-destructive" },
};

export function VerifiedBadge({
  status,
  showPending = true,
  className = "",
}: {
  status: VerificationStatus | null | undefined;
  showPending?: boolean;
  className?: string;
}) {
  if (!status) return null;
  if (status !== "approved" && !showPending) return null;
  const meta = MAP[status];
  const Icon = status === "approved" ? BadgeCheck : status === "pending" ? Clock : ShieldX;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.className} ${className}`}
      title={meta.am}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}
