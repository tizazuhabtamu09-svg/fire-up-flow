import { useLanguage } from "@/lib/i18n";import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { chooseOnboardingRole, fetchOnboardingStatus, joinPathForRole, type OnboardingRole } from "@/lib/onboarding";
import { BRAND } from "@/lib/app-config";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({
    meta: [
    { title: `Choose your role — ${BRAND.fullName}` },
    { name: "description", content: `Pick whether you join ${BRAND.name} as an employee, employer, or broker to finish your registration.` },
    { name: "robots", content: "noindex" }]

  }),
  component: OnboardingPage
});

const options: {role: OnboardingRole;icon: string;title: string;amharic: string;desc: string;}[] = [
{ role: "employee", icon: "🧑‍🔧", title: "Employee", amharic: "ሰራተኛ", desc: "Looking for work as a domestic or skilled worker." },
{ role: "employer", icon: "🏠", title: "Employer", amharic: "ቀጣሪ", desc: "Hiring trusted workers for your home." },
{ role: "broker", icon: "🤝", title: "Broker", amharic: "ደላላ", desc: "Connecting workers with employers." }];


function OnboardingPage() {const { t } = useLanguage();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState<OnboardingRole | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      if (!data.user) {
        navigate({ to: "/auth", replace: true });
        return;
      }
      setUserId(data.user.id);
      const status = await fetchOnboardingStatus(data.user.id);
      if (!active) return;
      if (status.state === "staff") navigate({ to: "/backoffice", replace: true });else
      if (status.state === "complete") navigate({ to: "/dashboard", replace: true });else
      if (status.state === "needs-form") navigate({ to: joinPathForRole[status.role], replace: true });else
      setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  async function pick(role: OnboardingRole) {
    if (!userId) return;
    setBusy(role);
    await chooseOnboardingRole(userId, role);
    navigate({ to: joinPathForRole[role], replace: true });
  }

  if (checking) return <div className="container-page py-24 text-center text-muted-foreground">{t("ui.loading")}</div>;

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold md:text-4xl">{t("ui.one.last.step")}</h1>
        <p className="mt-3 font-amharic text-lg text-muted-foreground">ሚናዎን ይምረጡ</p>
        <p className="mt-4 text-muted-foreground">{t("ui.choose.your.role.to.open.the.registration.form.you.ll")}

        </p>
      </div>
      <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
        {options.map((o) =>
        <button
          key={o.role}
          type="button"
          disabled={busy !== null}
          onClick={() => pick(o.role)}
          className="card-soft flex flex-col items-center p-8 text-center transition hover:-translate-y-1 disabled:opacity-60">
          
            <span className="text-4xl">{o.icon}</span>
            <span className="mt-4 text-xl font-bold">{o.title}</span>
            <span className="font-amharic text-muted-foreground">{o.amharic}</span>
            <span className="mt-3 text-sm text-muted-foreground">{o.desc}</span>
            <span className="btn-brand mt-6 inline-block">{busy === o.role ? "Opening…" : "Continue"}</span>
          </button>
        )}
      </div>
      <div className="mt-10 text-center">
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth", replace: true });
          }}
          className="text-sm text-muted-foreground underline">{t("ui.sign.out")}


        </button>
      </div>
    </div>);

}
