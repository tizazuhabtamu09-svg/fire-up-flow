import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AdminSection } from "@/components/admin/shared";
import { UserManagement } from "@/components/admin/UserManagement";
import { useStaff } from "@/components/backoffice/context";
import { useWalletAccess } from "@/lib/wallet-access";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/backoffice/users")({
  component: BackofficeUsers,
});

function BackofficeUsers() {
  const staff = useStaff();
  const navigate = useNavigate();
  const { isSuperAdmin } = useWalletAccess(staff.userId);
  const { t } = useLanguage();

  useEffect(() => {
    if (!staff.isAdmin) navigate({ to: "/access-denied", replace: true });
  }, [staff.isAdmin, navigate]);

  if (!staff.isAdmin) return null;

  return (
    <AdminSection
      title={t("back.users.title")}
      description={t("back.users.description")}
    >
      <UserManagement canAdjustWallet={isSuperAdmin} />
    </AdminSection>
  );
}
