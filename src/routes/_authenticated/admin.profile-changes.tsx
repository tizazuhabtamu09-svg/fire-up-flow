import { createFileRoute } from "@tanstack/react-router";
import { ChangeRequestQueue } from "@/components/admin/ChangeRequestQueue";

export const Route = createFileRoute("/_authenticated/admin/profile-changes")({
  head: () => ({
    meta: [
      { title: "Profile change requests — Agaze/አጋዝ" },
      {
        name: "description",
        content: "Review broker-submitted registration corrections and approve or decline each change.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfileChangesPage,
});

function ProfileChangesPage() {
  return (
    <div>
      <h2 className="text-xl font-bold">Profile change requests</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Broker-submitted registration corrections waiting for admin or KYC review.
      </p>
      <ChangeRequestQueue />
    </div>
  );
}
