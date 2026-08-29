import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  chooseOnboardingRole,
  fetchOnboardingStatus,
  joinPathForRole,
  type OnboardingRole,
} from "@/lib/onboarding";

/** Role the visitor picked before starting Google sign-up. */
export const PENDING_ROLE_KEY = "agaze:pending-role";

export const Route = createFileRoute("/oauth-callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Finishing sign-in — Agaze/አጋዝ" },
      { name: "description", content: "Completing your Agaze sign-in and opening your registration form." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OAuthCallback,
});

function OAuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Finishing sign-in…");

  useEffect(() => {
    let active = true;

    async function finish() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        navigate({ to: "/auth", replace: true });
        return;
      }

      // Carry the Google profile over so the registration form is pre-filled.
      const meta = user.user_metadata as {
        full_name?: string;
        name?: string;
        avatar_url?: string;
        picture?: string;
      };
      const fullName = meta.full_name ?? meta.name ?? null;
      const avatar = meta.avatar_url ?? meta.picture ?? null;
      if (fullName || avatar) {
        await supabase
          .from("profiles")
          .upsert(
            { id: user.id, full_name: fullName ?? undefined, avatar_url: avatar ?? undefined },
            { onConflict: "id" },
          );
      }

      const pending = window.localStorage.getItem(PENDING_ROLE_KEY) as OnboardingRole | null;
      if (pending && ["employee", "employer", "broker"].includes(pending)) {
        window.localStorage.removeItem(PENDING_ROLE_KEY);
        await chooseOnboardingRole(user.id, pending);
      }

      const status = await fetchOnboardingStatus(user.id);
      if (!active) return;
      if (status.state === "staff") navigate({ to: "/backoffice", replace: true });
      else if (status.state === "complete") navigate({ to: "/dashboard", replace: true });
      else if (status.state === "needs-form") navigate({ to: joinPathForRole[status.role], replace: true });
      else navigate({ to: "/onboarding", replace: true });
    }

    finish().catch(() => {
      if (active) setMessage("We couldn't finish sign-in. Please try again.");
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  return <div className="container-page py-24 text-center text-muted-foreground">{message}</div>;
}
