import { createFileRoute } from "@tanstack/react-router";
import { AdminSection } from "@/components/admin/shared";
import { EmployeeRequests } from "@/components/admin/EmployeeRequests";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/requests")({
  component: AdminRequests,
});

function AdminRequests() {
  const { t } = useLanguage();
  return (
    <AdminSection
      title={t("admin.requests.title")}
      description={t("admin.requests.description")}
    >
      <EmployeeRequests />
    </AdminSection>
  );
}
