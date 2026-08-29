import { createFileRoute } from "@tanstack/react-router";
import { AdminSection } from "@/components/admin/shared";
import { EmployeeRequests } from "@/components/admin/EmployeeRequests";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/backoffice/requests")({
  component: BackofficeRequests,
});

function BackofficeRequests() {
  const { t } = useLanguage();
  return (
    <AdminSection
      title={t("back.requests.title")}
      description={t("back.requests.description")}
    >
      <EmployeeRequests />
    </AdminSection>
  );
}
