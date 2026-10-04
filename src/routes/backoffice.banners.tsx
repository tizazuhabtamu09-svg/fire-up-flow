import { useLanguage } from "@/lib/i18n";import { createFileRoute } from "@tanstack/react-router";
import { AdminSection } from "@/components/admin/shared";
import { BannerManager } from "@/components/admin/BannerManager";
import { useStaff } from "@/components/backoffice/context";

export const Route = createFileRoute("/backoffice/banners")({
  head: () => ({
    meta: [
    { title: "Posting — banners & advertisements — Agaze/አጋዝ" },
    { name: "description", content: "Create, schedule and manage advertisement banners for the site." },
    { name: "robots", content: "noindex" }]

  }),
  component: BackofficeBanners
});

function BackofficeBanners() {const { t } = useLanguage();
  const staff = useStaff();
  return (
    <AdminSection
      title={t("ui.posting.banners.advertisements")}
      description="Publish image or text advertisements. Upload one wide graphic for desktop and one for mobile; the site switches between them automatically based on the visitor's screen.">
      
      <BannerManager userId={staff?.userId ?? null} />
    </AdminSection>);

}
