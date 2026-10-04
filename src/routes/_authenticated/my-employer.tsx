import { useLanguage } from "@/lib/i18n";import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { loadMyEmployers, type EmployerMapping } from "@/lib/employee-employer";
import { MyEmployerCard } from "@/components/employee/MyEmployerCard";

export const Route = createFileRoute("/_authenticated/my-employer")({
  head: () => ({
    meta: [
    { title: "My Employer — Agaze/አጋዝ" },
    { name: "description", content: "Your current employer: chat, rate, report or request termination." },
    { name: "robots", content: "noindex" }]

  }),
  component: MyEmployerPage
});

type TerminationRow = {
  id: string;
  employer_name: string;
  reason: string;
  status: string;
  admin_note: string | null;
  created_at: string;
};

const TERMINATION_STATUS_LABEL: Record<string, string> = {
  pending_employer: "Waiting for employer",
  pending_review: "Under back-office review",
  approved: "Approved",
  declined: "Declined"
};

function MyEmployerPage() {const { t } = useLanguage();
  const { user } = useSession();
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [mappings, setMappings] = useState<EmployerMapping[]>([]);
  const [terminations, setTerminations] = useState<TerminationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { workerId: wid, mappings: m } = await loadMyEmployers(user.id);
    setWorkerId(wid);
    setMappings(m);
    const { data } = await supabase.
    from("employee_termination_requests").
    select("id, employer_name, reason, status, admin_note, created_at").
    eq("employee_id", user.id).
    order("created_at", { ascending: false });
    setTerminations((data ?? []) as TerminationRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="text-3xl font-bold">{t("ui.my.employer")}</h1>
      <p className="text-sm text-muted-foreground">{t("ui.your.current.placement.chat.with.your.employer.rate.th")}

      </p>

      {loading ?
      <p className="mt-8 text-muted-foreground">{t("ui.loading")}</p> :
      mappings.length === 0 ?
      <div className="card-soft mt-8 p-10 text-center">
          <p className="text-muted-foreground">{t("ui.you.are.not.assigned.to.an.employer.yet.once.the.back")}

        </p>
        </div> :

      <div className="mt-8 space-y-4">
          {mappings.map((m) =>
        <MyEmployerCard
          key={m.hiredId ?? m.assignmentId ?? m.employerName}
          mapping={m}
          workerId={workerId!}
          employeeId={user!.id}
          pendingTermination={terminations.some(
            (t) => t.employer_name === m.employerName && t.status.startsWith("pending")
          )}
          onChanged={load} />

        )}
        </div>

      }

      {terminations.length > 0 &&
      <div className="mt-10">
          <h2 className="text-xl font-bold">{t("ui.my.termination.requests")}</h2>
          <div className="mt-4 space-y-3">
            {terminations.map((r) =>
          <div key={r.id} className="card-soft flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-semibold">{r.employer_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.reason}{t("ui.filed")}{new Date(r.created_at).toLocaleDateString()}
                    {r.admin_note ? ` · Note: ${r.admin_note}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                  {TERMINATION_STATUS_LABEL[r.status] ?? r.status}
                </span>
              </div>
          )}
          </div>
        </div>
      }
    </div>);

}
