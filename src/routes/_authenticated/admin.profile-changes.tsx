import { useLanguage } from "@/lib/i18n";import { createFileRoute } from "@tanstack/react-router";
import { ChangeRequestQueue } from "@/components/admin/ChangeRequestQueue";

export const Route = createFileRoute("/_authenticated/admin/profile-changes")({
  head: () => ({
    meta: [
    { title: "Profile change requests — Agaze/አጋዝ" },
    {
      name: "description",
      content: "Review broker-submitted registration corrections and approve or decline each change."
    },
    { name: "robots", content: "noindex" }]

  }),
  component: ProfileChangesPage
});

function ProfileChangesPage() {const { t } = useLanguage();
  return (
    <div>
      <h2 className="text-xl font-bold">{t("ui.profile.change.requests")}</h2>
      <p className="mb-6 text-sm text-muted-foreground">{t("ui.broker.submitted.registration.corrections.waiting.for")}

      </p>
      <ChangeRequestQueue />
    </div>);

}
