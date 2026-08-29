import { useState } from "react";
import { MessageSquare, ShieldAlert, Star, UserMinus } from "lucide-react";
import { EmployeeAvatar } from "@/components/EmployeeAvatar";
import { RateEmployerModal } from "@/components/employee/RateEmployerModal";
import { ReportEmployerModal } from "@/components/employee/ReportEmployerModal";
import { EmployeeTerminateModal } from "@/components/employee/EmployeeTerminateModal";
import { EmployerChat } from "@/components/employee/EmployerChat";
import type { EmployerMapping } from "@/lib/employee-employer";

/**
 * Card for one assigned employer: shows placement details and the four actions
 * (chat, rate, report, request termination). Chat is only available for direct
 * placements — broker placements are coordinated through the broker.
 */
export function MyEmployerCard({
  mapping,
  workerId,
  employeeId,
  pendingTermination = false,
  onChanged,
}: {
  mapping: EmployerMapping;
  workerId: string;
  employeeId: string;
  pendingTermination?: boolean;
  onChanged: () => void;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [rating, setRating] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [terminating, setTerminating] = useState(false);

  return (
    <div className="card-soft p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <EmployeeAvatar photoUrl={null} name={mapping.employerName} className="h-11 w-11 rounded-2xl" />
          <div>
            <p className="font-semibold">{mapping.employerName}</p>
            <p className="text-sm text-muted-foreground">
              {[
                mapping.employerCity,
                mapping.employerPhone,
                mapping.salary ? `ETB ${Number(mapping.salary).toLocaleString()} / month` : null,
                mapping.kind === "broker" ? "via broker" : null,
              ]
                .filter(Boolean)
                .join(" · ") || "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              Since {new Date(mapping.since).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pendingTermination && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              Termination pending
            </span>
          )}
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold capitalize text-emerald-800">
            {mapping.status}
          </span>
        </div>
      </div>


      <div className="mt-4 flex flex-wrap gap-2">
        {mapping.employerId && (
          <button
            onClick={() => setChatOpen((v) => !v)}
            className="btn-brand inline-flex items-center gap-1.5 text-xs"
          >
            <MessageSquare className="h-3.5 w-3.5" /> {chatOpen ? "Hide chat" : "Chat"}
          </button>
        )}
        <button onClick={() => setRating(true)} className="btn-outline-brand inline-flex items-center gap-1.5 text-xs">
          <Star className="h-3.5 w-3.5" /> Rate employer
        </button>
        <button onClick={() => setReporting(true)} className="btn-outline-brand inline-flex items-center gap-1.5 text-xs">
          <ShieldAlert className="h-3.5 w-3.5" /> Report employer
        </button>
        <button
          onClick={() => setTerminating(true)}
          disabled={pendingTermination}
          className="inline-flex items-center gap-1.5 rounded-full border border-destructive px-4 py-2 text-xs font-semibold text-destructive disabled:opacity-50"
        >
          <UserMinus className="h-3.5 w-3.5" />
          {pendingTermination ? "Termination requested" : "Request termination"}
        </button>

      </div>

      {chatOpen && mapping.employerId && (
        <div className="mt-4">
          <EmployerChat me={employeeId} other={mapping.employerId} otherName={mapping.employerName} />
        </div>
      )}

      {rating && (
        <RateEmployerModal mapping={mapping} workerId={workerId} employeeId={employeeId} onClose={() => setRating(false)} />
      )}
      {reporting && (
        <ReportEmployerModal mapping={mapping} workerId={workerId} employeeId={employeeId} onClose={() => setReporting(false)} />
      )}
      {terminating && (
        <EmployeeTerminateModal
          mapping={mapping}
          workerId={workerId}
          employeeId={employeeId}
          onClose={() => setTerminating(false)}
          onSent={onChanged}
        />
      )}
    </div>
  );
}
