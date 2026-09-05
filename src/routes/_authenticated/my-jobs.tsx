import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Phone, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { money } from "@/lib/app-config";
import { employmentLabel, JOB_STATUS_LABEL, useJobAccess, type JobApplication, type JobPost } from "@/lib/jobs";
import { applicationFileUrl } from "@/lib/application-files";

export const Route = createFileRoute("/_authenticated/my-jobs")({
  head: () => ({
    meta: [
      { title: "My job posts — Agaze/አጋዝ" },
      { name: "description", content: "Track your job listings, review applicants and close filled roles." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyJobsPage,
});

function MyJobsPage() {
  const { user } = useSession();
  const access = useJobAccess(user?.id);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [apps, setApps] = useState<Record<string, JobApplication[]>>({});
  const [openJob, setOpenJob] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("job_posts")
      .select("*")
      .eq("employer_id", user.id)
      .order("created_at", { ascending: false });
    setJobs(data ?? []);
    // Applicant counts per job so employers see interest at a glance.
    const ids = (data ?? []).map((j) => j.id);
    if (ids.length > 0) {
      const { data: rows } = await supabase
        .from("job_applications")
        .select("job_id")
        .in("job_id", ids);
      const tally: Record<string, number> = {};
      for (const r of rows ?? []) tally[r.job_id] = (tally[r.job_id] ?? 0) + 1;
      setCounts(tally);
    } else {
      setCounts({});
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const [counts, setCounts] = useState<Record<string, number>>({});

  async function loadApplications(jobId: string) {
    const { data, error: err } = await supabase
      .from("job_applications")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });
    if (err) return setError(err.message);
    setApps((a) => ({ ...a, [jobId]: data ?? [] }));
    setCounts((c) => ({ ...c, [jobId]: data?.length ?? 0 }));
  }

  async function toggleApplicants(jobId: string) {
    if (openJob === jobId) return setOpenJob(null);
    setOpenJob(jobId);
    if (!apps[jobId]) await loadApplications(jobId);
  }

  async function closeJob(job: JobPost) {
    const { error: err } = await supabase
      .from("job_posts")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", job.id);
    if (err) return setError(err.message);
    setJobs((list) => list.map((j) => (j.id === job.id ? { ...j, status: "closed" } : j)));
  }

  async function setApplicationStatus(app: JobApplication, status: string) {
    const { error: err } = await supabase.from("job_applications").update({ status }).eq("id", app.id);
    if (err) return setError(err.message);
    setApps((a) => ({
      ...a,
      [app.job_id]: (a[app.job_id] ?? []).map((x) => (x.id === app.id ? { ...x, status } : x)),
    }));
  }

  if (access.loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">My job posts</h1>
          <p className="font-amharic text-muted-foreground">የእኔ የስራ ማስታወቂያዎች</p>
        </div>
        {access.canPost && (
          <Link to="/post-job" className="btn-brand inline-flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" /> Post a Job
          </Link>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {jobs.length === 0 ? (
        <div className="card-soft mt-8 p-10 text-center">
          <p className="font-semibold">You haven't posted a job yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create a listing and reach verified employees.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="card-soft p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{job.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {employmentLabel(job.employment_type)} ·{" "}
                    {[job.city, job.area].filter(Boolean).join(" · ") || "Ethiopia"}
                    {job.salary != null ? ` · ${money(Number(job.salary))}/mo` : ""}
                  </p>
                  {job.admin_note && (
                    <p className="mt-1 text-xs text-muted-foreground">Reviewer note: {job.admin_note}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase text-muted-foreground">
                    {JOB_STATUS_LABEL[job.status] ?? job.status}
                  </span>
                  {job.status === "awaiting_payment" && (
                    <Link
                      to="/payment"
                      search={{ purpose: "job_post", amount: Number(job.fee_amount), job: job.id }}
                      className="btn-brand text-xs"
                    >
                      Pay {money(Number(job.fee_amount))}
                    </Link>
                  )}
                  <button onClick={() => toggleApplicants(job.id)} className="btn-outline-brand text-xs">
                    {openJob === job.id ? "Hide applicants" : "Applicants"}
                  </button>
                  {job.status !== "closed" && (
                    <button onClick={() => closeJob(job)} className="text-xs font-semibold text-destructive hover:underline">
                      Close job
                    </button>
                  )}
                </div>
              </div>

              {openJob === job.id && (
                <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
                  {(apps[job.id] ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No applications yet.</p>
                  ) : (
                    (apps[job.id] ?? []).map((app) => (
                      <div key={app.id} className="rounded-xl border border-border/60 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{app.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {[app.city, app.experience].filter(Boolean).join(" · ") || "Verified employee"}
                            </p>
                            {app.phone && (
                              <a href={`tel:${app.phone}`} className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                                <Phone className="h-3.5 w-3.5" /> {app.phone}
                              </a>
                            )}
                            {app.address && <p className="mt-1 text-xs text-muted-foreground">{app.address}</p>}
                            {app.message && <p className="mt-2 text-sm">{app.message}</p>}
                            <ApplicantDocs app={app} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold uppercase text-muted-foreground">
                              {app.status}
                            </span>
                            {app.worker_id && (
                              <Link to="/employee/$id" params={{ id: app.worker_id }} className="btn-outline-brand text-xs">
                                View profile
                              </Link>
                            )}
                            {app.status === "pending" && (
                              <>
                                <button onClick={() => setApplicationStatus(app, "shortlisted")} className="btn-brand text-xs">
                                  Shortlist
                                </button>
                                <button
                                  onClick={() => setApplicationStatus(app, "rejected")}
                                  className="text-xs font-semibold text-destructive hover:underline"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** CV, education document and typed education details attached to an application. */
function ApplicantDocs({ app }: { app: JobApplication }) {
  const [links, setLinks] = useState<{ cv?: string | null; edu?: string | null }>({});
  const edu = (app.education ?? null) as Record<string, string> | null;

  useEffect(() => {
    let active = true;
    Promise.all([applicationFileUrl(app.cv_path), applicationFileUrl(app.education_document)]).then(
      ([cv, eduUrl]) => {
        if (active) setLinks({ cv, edu: eduUrl });
      },
    );
    return () => {
      active = false;
    };
  }, [app.cv_path, app.education_document]);

  const eduLine = edu
    ? [edu.level, edu.field, edu.institution, edu.year].filter(Boolean).join(" · ")
    : "";

  if (!eduLine && !links.cv && !links.edu) return null;

  return (
    <div className="mt-2 space-y-1">
      {eduLine && <p className="text-xs text-muted-foreground">Education: {eduLine}</p>}
      <div className="flex flex-wrap gap-3 text-xs font-semibold text-primary">
        {links.cv && (
          <a href={links.cv} target="_blank" rel="noreferrer" className="hover:underline">
            View CV
          </a>
        )}
        {links.edu && (
          <a href={links.edu} target="_blank" rel="noreferrer" className="hover:underline">
            View education document
          </a>
        )}
      </div>
    </div>
  );
}
