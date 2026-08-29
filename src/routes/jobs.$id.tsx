import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/app-config";
import { useSession } from "@/lib/use-session";
import { employmentLabel, useJobAccess, type JobPost } from "@/lib/jobs";

export const Route = createFileRoute("/jobs/$id")({
  head: () => ({
    meta: [
      { title: "Job details — Agaze/አጋዝ" },
      {
        name: "description",
        content: "Job details and requirements for a verified Agaze employer listing. Verified employees can apply directly.",
      },
      { property: "og:title", content: "Job details — Agaze/አጋዝ" },
      { property: "og:description", content: "Apply to a verified employer listing on Agaze." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JobDetail,
});

function JobDetail() {
  const { id } = Route.useParams();
  const { user } = useSession();
  const access = useJobAccess(user?.id);
  const [job, setJob] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("job_posts")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setJob(data ?? null);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("job_applications")
      .select("id")
      .eq("job_id", id)
      .eq("applicant_id", user.id)
      .maybeSingle()
      .then(({ data }) => setApplied(Boolean(data)));
    supabase
      .from("profiles")
      .select("phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setPhone((p) => p || data?.phone || ""));
  }, [id, user]);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !job) return;
    setSaving(true);
    setError(null);
    const [{ data: profile }, { data: worker }] = await Promise.all([
      supabase.from("profiles").select("full_name, city").eq("id", user.id).maybeSingle(),
      supabase
        .from("workers")
        .select("id, full_name, city, experience")
        .eq("user_id", user.id)
        .eq("verification_status", "approved")
        .maybeSingle(),
    ]);
    const { error: err } = await supabase.from("job_applications").insert({
      job_id: job.id,
      applicant_id: user.id,
      worker_id: worker?.id ?? null,
      full_name: worker?.full_name || profile?.full_name || user.email || "Applicant",
      phone: phone.trim() || null,
      city: worker?.city || profile?.city || null,
      experience: worker?.experience ?? null,
      message: message.trim() || null,
    });
    setSaving(false);
    if (err) setError(err.message);
    else setApplied(true);
  }

  if (loading) return <div className="container-page py-10 text-muted-foreground">Loading…</div>;
  if (!job)
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-bold">Job not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This listing may have been closed.</p>
        <Link to="/jobs" className="btn-brand mt-6 inline-block">Browse open jobs</Link>
      </div>
    );

  return (
    <div className="container-page max-w-3xl py-10">
      <Link to="/jobs" className="text-sm font-semibold text-primary hover:underline">← All jobs</Link>
      <h1 className="mt-3 text-3xl font-bold">{job.title}</h1>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        {[job.city, job.sub_city, job.area].filter(Boolean).join(" · ") || "Ethiopia"} ·{" "}
        {employmentLabel(job.employment_type)}
        {job.duration ? ` · ${job.duration}` : ""}
      </p>
      {job.salary != null && (
        <p className="mt-2 text-lg font-bold text-primary">
          {money(Number(job.salary))}
          {job.salary_max != null ? ` – ${money(Number(job.salary_max))}` : ""} / month
        </p>
      )}

      <div className="card-soft mt-6 space-y-4 p-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Job description</h2>
          <p className="mt-2 whitespace-pre-line text-sm">{job.description}</p>
        </div>
        {job.requirements && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Requirements</h2>
            <p className="mt-2 whitespace-pre-line text-sm">{job.requirements}</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Openings: {job.openings} · Posted by {job.employer_name || "a verified employer"}
        </p>
      </div>

      <div className="card-soft mt-6 p-6">
        {!user ? (
          <>
            <h2 className="text-lg font-bold">Sign in to apply</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Applications are open to verified Agaze employees.
            </p>
            <Link to="/auth" className="btn-brand mt-4 inline-block text-sm">Sign in</Link>
          </>
        ) : applied ? (
          <>
            <h2 className="text-lg font-bold">Application sent ✅</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The employer can now see your profile and phone number.
            </p>
          </>
        ) : access.loading ? (
          <p className="text-sm text-muted-foreground">Checking your account…</p>
        ) : !access.canApply ? (
          <>
            <h2 className="text-lg font-bold">Verified employees only</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete your employee registration and wait for verification to apply for jobs.
            </p>
            <Link to="/join/employee" className="btn-outline-brand mt-4 inline-block text-sm">
              Register as an employee
            </Link>
          </>
        ) : (
          <form onSubmit={apply} className="space-y-4">
            <h2 className="text-lg font-bold">Apply for this job</h2>
            <label className="block">
              <span className="text-sm font-medium">
                <Phone className="mr-1 inline h-3.5 w-3.5" />
                Phone number the employer can call
              </span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Message (optional)</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:border-primary"
                placeholder="Tell the employer about your experience"
              />
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button disabled={saving} className="btn-brand disabled:opacity-60">
              {saving ? "Sending…" : "Send application"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
