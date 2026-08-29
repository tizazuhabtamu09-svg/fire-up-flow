import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/access-denied")({
  head: () => ({
    meta: [
      { title: "Access denied — Agaze/አጋዝ" },
      { name: "description", content: "This area of Agaze/አጋዝ is reserved for authorised back-office staff." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Access denied — Agaze/አጋዝ" },
      { property: "og:description", content: "This area of Agaze/አጋዝ is reserved for authorised back-office staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccessDenied,
});

function AccessDenied() {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="card-soft max-w-md p-10 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The back office is restricted to Agaze admins, sub-admins and KYC reviewers. Your account doesn't have that
          permission.
        </p>
        <p className="font-amharic mt-1 text-sm text-muted-foreground">ይህ ክፍል ለሰራተኞች ብቻ ነው።</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/dashboard" className="btn-brand text-sm">Go to my dashboard</Link>
          <Link to="/" className="btn-outline-brand text-sm">Back to home</Link>
        </div>
      </div>
    </div>
  );
}
