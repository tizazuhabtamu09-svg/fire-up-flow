import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import type { VerificationStatus } from "@/lib/use-session";

/**
 * Brokers can only register employers and employees once their own documents
 * have been approved by an admin or KYC officer.
 */
export function BrokerLock({ status }: { status: VerificationStatus | null | undefined }) {
  return (
    <div className="card-soft mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 text-destructive" />
        <div>
          <p className="font-semibold">Verification required</p>
          <p className="max-w-xl text-sm text-muted-foreground">
            {status === "declined"
              ? "Your broker documents were declined. Upload clear documents again to unlock registration."
              : "You can register employers and employees as soon as your broker documents are approved. Verification usually takes less than a day."}
          </p>
        </div>
      </div>
      <Link to="/profile" className="btn-outline-brand text-sm">Manage documents</Link>
    </div>
  );
}
