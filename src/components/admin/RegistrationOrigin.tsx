import { useLanguage } from "@/lib/i18n";

/**
 * Registration origin metadata (who created the record and how).
 * Admin-only: render nothing unless the viewer is an Admin.
 */
export function RegistrationOrigin({
  isAdmin,
  type,
  byName,
}: {
  isAdmin: boolean;
  type: string | null;
  byName: string | null;
}) {
  const { t } = useLanguage();
  if (!isAdmin || !type) return null;

  const label: Record<string, string> = {
    self: t("admin.origin.self"),
    broker: t("admin.origin.broker"),
    admin: t("admin.origin.admin"),
    sub_admin: t("admin.origin.subAdmin"),
    kyc: t("admin.origin.kyc"),
  };

  return (
    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
      {label[type] ?? type}
      {byName ? ` · ${t("admin.origin.by", { name: byName })}` : ""}
    </span>
  );
}
