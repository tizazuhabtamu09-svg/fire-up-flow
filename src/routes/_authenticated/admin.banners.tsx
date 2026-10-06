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
      description="Publish image or text advertisements for the top banner or the middle scrolling section. Add multiple banners to create a swipeable, automatically rotating slider; the site switches between desktop and mobile artwork automatically.">
      
      <BannerManager userId={user?.id ?? null} />
    </AdminSection>);

}
