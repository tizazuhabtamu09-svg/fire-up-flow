import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminSection } from "@/components/admin/shared";
import { ChangeEmail } from "@/components/ChangeEmail";
import { ChangePassword } from "@/components/ChangePassword";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/backoffice/settings")({
  component: StaffSettingsPage,
});

function StaffSettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  return (
    <AdminSection
      title={t("back.settings.title")}
      description={t("back.settings.description")}
    >
      <div className="card-soft space-y-5 p-6">
        <div>
          <p className="text-sm text-muted-foreground">{t("back.settings.signedInAs")}</p>
          <p className="font-semibold break-all">{email ?? "…"}</p>
        </div>
        <ChangeEmail currentEmail={email} />
        <ChangePassword />
      </div>
    </AdminSection>
  );
}
