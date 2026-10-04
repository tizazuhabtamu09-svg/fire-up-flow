import { useLanguage } from "@/lib/i18n";import { createFileRoute } from "@tanstack/react-router";
import { JobApprovals } from "@/components/admin/JobApprovals";
import { useStaff } from "@/components/backoffice/context";

export const Route = createFileRoute("/backoffice/jobs")({
  component: BackOfficeJobs
});

function BackOfficeJobs() {const { t } = useLanguage();
  const staff = useStaff();
  return (
    <div>
      <h1 className="text-2xl font-bold">{t("ui.job.posts")}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("ui.approve.or.reject.paid.employer.job.listings.and.close")}

      </p>
      <div className="mt-6">
        <JobApprovals reviewerId={staff.userId} />
      </div>
    </div>);

}
