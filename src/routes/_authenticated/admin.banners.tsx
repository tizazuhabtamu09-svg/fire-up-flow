import { useLanguage } from "@/lib/i18n";import { createFileRoute } from "@tanstack/react-router";
import { AdminSection } from "@/components/admin/shared";
import { BannerManager } from "@/components/admin/BannerManager";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/_authenticated/admin/banners")({
  head: () => ({
    meta: [
    { title: "Banners & advertisements — Agaze/አጋዝ" },
    { name: "description", content: "Create, schedule and manage home page advertisement banners." },
    { name: "robots", content: "noindex" }]

  }),
  component: AdminBanners
});

function AdminBanners() {const { t } = useLanguage();
  const { user } = useSession();
  return (
    <AdminSection
      title={t("ui.posting.banners.advertisements")}
      description="Publish image or text advertisements. Upload one wide graphic for desktop and one for mobile; the site switches between them automatically based on the visitor's screen.">
      
      <BannerManager userId={user?.id ?? null} />
    </AdminSection>);

}
