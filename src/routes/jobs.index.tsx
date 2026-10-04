import { useLanguage } from "@/lib/i18n";import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase, MapPin, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/app-config";
import { useSession } from "@/lib/use-session";
import { employmentLabel, useJobAccess, type JobPost } from "@/lib/jobs";

export const Route = createFileRoute("/jobs/")({
  head: () => ({
    meta: [
    { title: "Domestic & service jobs in Ethiopia — Agaze/አጋዝ" },
    {
      name: "description",
      content:
      "Browse verified job openings from Agaze employers: house maids, nannies, cooks, drivers, cleaners and more. Apply directly with your verified profile."
    },
    { property: "og:title", content: "Open jobs on Agaze/አጋዝ" },
    {
      property: "og:description",
      content: "Verified employers posting domestic and service jobs across Ethiopia."
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" }]

  }),
  component: JobsPage
});

function JobsPage() {const { t } = useLanguage();
  const { user } = useSession();
  const { canPost } = useJobAccess(user?.id);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    supabase.
    from("job_posts").
    select("*").
    eq("status", "published").
    order("published_at", { ascending: false }).
    then(({ data }) => {
      setJobs(data ?? []);
      setLoading(false);
    });
  }, []);

  const term = query.trim().toLowerCase();
  const visible = term ?
  jobs.filter((j) =>
  [j.title, j.city, j.area, j.description, j.sector_other].
  filter(Boolean).
  join(" ").
  toLowerCase().
  includes(term)
  ) :
  jobs;

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("ui.open.jobs")}</h1>
          <p className="font-amharic text-muted-foreground">ክፍት የስራ ቦታዎች</p>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("ui.every.listing.is.reviewed.by.our.team.before.it.goes.l")}


          </p>
        </div>
        {canPost &&
        <Link to="/post-job" className="btn-brand inline-flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" />{t("ui.post.a.job")}
        </Link>
        }
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("ui.search.by.title.city.or.keyword")}
        className="mt-6 w-full max-w-md rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
      

      {loading ?
      <p className="mt-8 text-sm text-muted-foreground">{t("ui.loading.jobs")}</p> :
      visible.length === 0 ?
      <div className="card-soft mt-8 p-10 text-center">
          <Briefcase className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">{t("ui.no.open.jobs.right.now")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("ui.check.back.soon.new.roles.are.posted.every.week")}</p>
        </div> :

      <div className="mt-8 grid gap-4 md:grid-cols-2">
          {visible.map((job) =>
        <Link
          key={job.id}
          to="/jobs/$id"
          params={{ id: job.id }}
          className="card-soft block p-5 transition hover:border-primary/50 hover:shadow-md">
          
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold">{job.title}</h2>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold uppercase text-muted-foreground">
                  {employmentLabel(job.employment_type)}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {[job.city, job.sub_city, job.area].filter(Boolean).join(" · ") || "Ethiopia"}
              </p>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{job.description}</p>
              {job.salary != null &&
          <p className="mt-3 text-sm font-semibold text-primary">
                  {money(Number(job.salary))}
                  {job.salary_max != null ? ` – ${money(Number(job.salary_max))}` : ""}{t("ui.month")}
          </p>
          }
            </Link>
        )}
        </div>
      }
    </div>);

}
