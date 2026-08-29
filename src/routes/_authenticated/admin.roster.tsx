import { createFileRoute } from "@tanstack/react-router";
import { AdminSection } from "@/components/admin/shared";
import { CandidateRoster } from "@/components/admin/CandidateRoster";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/roster")({
  component: AdminRoster,
});

function AdminRoster() {
  const { t } = useLanguage();
  return (
    <AdminSection
      title={t("admin.roster.title")}
      description={t("admin.roster.description")}
    >
      <CandidateRoster />
    </AdminSection>
  );
}
