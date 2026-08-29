import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/app-config";
import { employmentLabel, JOB_STATUS_LABEL, type JobPost } from "@/lib/jobs";

const FILTERS = [
  { value: "pending_approval", label: "Pending approval" },
  { value: "published", label: "Live" },
  { value: "awaiting_payment", label: "Awaiting payment" },
  { value: "rejected", label: "Rejected" },
  { value: "closed", label: "Closed" },
];

/** Staff queue: approve, reject or close employer job posts. */
export function JobApprovals({ reviewerId }: { reviewerId: string }) {
  const [filter, setFilter] = useState("pending_approval");
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("job_posts")
      .select("*")
      .eq("status", filter)
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    setJobs(data ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function review(job: JobPost, next: "published" | "rejected" | "closed") {
    const now = new Date().toISOString();
    const patch = {
      status: next,
      admin_note: notes[job.id]?.trim() || null,
      reviewed_by: reviewerId,
      reviewed_at: now,
      ...(next === "published" ? { published_at: now } : {}),
      ...(next === "closed" ? { closed_at: now } : {}),
    };
    const { error: err } = await supabase.from("job_posts").update(patch).eq("id", job.id);
    if (err) return setError(err.message);
    setJobs((list) => list.filter((j) => j.id !== job.id));
    setStatus(`${job.title} — ${JOB_STATUS_LABEL[next]}.`);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
              filter === f.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      {status && <p className="mt-4 text-sm text-primary">{status}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : jobs.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Nothing in this queue.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="card-soft p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{job.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {job.employer_name || "Employer"} · {employmentLabel(job.employment_type)} ·{" "}
                    {[job.city, job.area].filter(Boolean).join(" · ") || "Ethiopia"} · fee{" "}
                    {money(Number(job.fee_amount))}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase text-muted-foreground">
                  {JOB_STATUS_LABEL[job.status] ?? job.status}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{job.description}</p>
              {job.requirements && (
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Requirements: </span>
                  {job.requirements}
                </p>
              )}
              {job.contact_phone && <p className="mt-2 text-sm">Contact: {job.contact_phone}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <input
                  value={notes[job.id] ?? ""}
                  onChange={(e) => setNotes({ ...notes, [job.id]: e.target.value })}
                  placeholder="Note to the employer (optional)"
                  className="min-w-[220px] flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
                {job.status !== "published" && (
                  <button onClick={() => review(job, "published")} className="btn-brand text-xs">Approve &amp; publish</button>
                )}
                {job.status !== "rejected" && (
                  <button onClick={() => review(job, "rejected")} className="btn-outline-brand text-xs">Reject</button>
                )}
                {job.status !== "closed" && (
                  <button onClick={() => review(job, "closed")} className="text-xs font-semibold text-destructive hover:underline">
                    Close job
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
