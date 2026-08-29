import { createFileRoute } from "@tanstack/react-router";
import { AdminSection } from "@/components/admin/shared";
import { UnifiedAccountCreator } from "@/components/admin/UnifiedAccountCreator";
import { useStaff } from "@/components/backoffice/context";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/backoffice/accounts")({
  component: CreateAccountsPage,
});

function CreateAccountsPage() {
  const staff = useStaff();
  const { t } = useLanguage();
  return (
    <AdminSection
      title={t("back.accounts.title")}
      description={staff.isAdmin ? t("back.accounts.descriptionAdmin") : t("back.accounts.descriptionStaff")}
    >
      <UnifiedAccountCreator creatorId={staff.userId} />
    </AdminSection>
  );
}
