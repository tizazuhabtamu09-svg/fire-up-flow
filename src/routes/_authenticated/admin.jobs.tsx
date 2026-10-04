import { useLanguage } from "@/lib/i18n";import { createFileRoute } from "@tanstack/react-router";
import { AdminSection } from "@/components/admin/shared";
import { JobApprovals } from "@/components/admin/JobApprovals";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/_authenticated/admin/jobs")({
  component: AdminJobs
});

function AdminJobs() {const { t } = useLanguage();
  const { user } = useSession();
  if (!user) return <p className="text-muted-foreground">{t("ui.loading")}</p>;
  return (
    <AdminSection
      title={t("ui.job.posts")}
      description="Review paid employer job listings. Approved posts go live publicly; you can also close any job.">
      
      <JobApprovals reviewerId={user.id} />
    </AdminSection>);

}
