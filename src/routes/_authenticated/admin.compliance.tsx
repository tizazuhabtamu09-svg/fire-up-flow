import { createFileRoute } from "@tanstack/react-router";
import { AdminSection } from "@/components/admin/shared";
import { IncidentReports } from "@/components/admin/IncidentReports";
import { TerminationRequests } from "@/components/admin/TerminationRequests";
import { useSession } from "@/lib/use-session";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/compliance")({
  component: AdminCompliance,
});

function AdminCompliance() {
  const { user } = useSession();
  const { t } = useLanguage();
  return (
    <div className="space-y-8">
    <AdminSection
      title={t("admin.compliance.incidentsTitle")}
      description={t("admin.compliance.incidentsDescription")}
    >
      <IncidentReports />
    </AdminSection>

    <AdminSection
      title={t("admin.compliance.terminationTitle")}
      description={t("admin.compliance.terminationDescription")}
    >
      <TerminationRequests viewerId={user?.id ?? null} />
    </AdminSection>
    </div>
  );
}
