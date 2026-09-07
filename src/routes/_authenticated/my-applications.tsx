import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import type { JobApplication } from "@/lib/jobs";

export const Route = createFileRoute("/_authenticated/my-applications")({
  head: () => ({
    meta: [
      { title: "My applications — Agaze/አጋዝ" },
      { name: "description", content: "Track the progress of every job you applied to on Agaze." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyApplications,
});

type Row = JobApplication & { job?: { title: string | null; employer_name: string | null; city: string | null } | null };

const STAGE: Record<string, { label: string; tone: string; note: string }> = {
  pending: { label: "Received", tone: "bg-secondary text-muted-foreground", note: "The employer has your application." },
  reviewing: { label: "Under review", tone: "bg-primary/10 text-primary", note: "The employer is reviewing your details." },
  shortlisted: { label: "Shortlisted", tone: "bg-primary/15 text-primary", note: "You have been shortlisted — expect a call." },
  hired: { label: "Hired", tone: "bg-primary/20 text-primary", note: "Congratulations, you got the job." },
  rejected: { label: "Not selected", tone: "bg-destructive/10 text-destructive", note: "The employer chose another candidate." },
};

function MyApplications() {
  const { user } = useSession();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("job_applications")
      .select("*, job:job_posts(title, employer_name, city)")
      .eq("applicant_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows((data as Row[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const incomplete = rows.some((r) => !r.profile_complete);

  return (
    <div>
      <h1 className="text-3xl font-bold">My applications</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Follow the progress of each job you applied to. The employer updates the status.
      </p>

      {incomplete && (
        <div className="card-soft mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm">
            Finish your employee profile so employers can see your full details and verify you.
          </p>
          <Link to="/join/employee" className="btn-brand text-sm">Complete my profile</Link>
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="card-soft mt-6 p-10 text-center">
          <p className="text-muted-foreground">You have not applied to any job yet.</p>
          <Link to="/jobs" className="btn-brand mt-5 inline-block text-sm">Browse open jobs</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((r) => {
            const stage = STAGE[r.status] ?? STAGE.pending;
            return (
              <div key={r.id} className="card-soft flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <Link to="/jobs/$id" params={{ id: r.job_id }} className="font-semibold hover:underline">
                    {r.job?.title ?? "Job"}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {[r.job?.employer_name, r.job?.city].filter(Boolean).join(" · ") || "Employer"} ·{" "}
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{r.employer_note || stage.note}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stage.tone}`}>{stage.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
