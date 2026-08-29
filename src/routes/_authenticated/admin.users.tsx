import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useRoleFlags, useSession } from "@/lib/use-session";
import { AdminSection } from "@/components/admin/shared";
import { CreateStaffPanel } from "@/components/admin/CreateStaffForms";
import { UserManagement } from "@/components/admin/UserManagement";
import { useWalletAccess } from "@/lib/wallet-access";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const { user } = useSession();
  const { isAdmin } = useRoleFlags(user?.id);
  const { isSuperAdmin } = useWalletAccess(user?.id);
  const [reload, setReload] = useState(0);
  const { t } = useLanguage();

  return (
    <AdminSection
      title={t("admin.users.title")}
      description={t("admin.users.description")}
    >
      <UserManagement key={reload} canAdjustWallet={isSuperAdmin} />

      {isAdmin ? (
        <CreateStaffPanel onCreated={() => setReload((n) => n + 1)} />
      ) : (
        <p className="mt-10 text-sm text-muted-foreground">
          {t("admin.users.onlyPrimaryAdmin")}
        </p>
      )}
    </AdminSection>
  );
}
