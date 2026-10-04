import { useLanguage } from "@/lib/i18n";import { createFileRoute } from "@tanstack/react-router";
import { BrokerNav } from "@/components/BrokerNav";
import { UnifiedAccountCreator } from "@/components/admin/UnifiedAccountCreator";
import { useSession } from "@/lib/use-session";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/broker/accounts")({
  head: () => ({
    meta: [
    { title: "Create accounts — Agaze/አጋዝ" },
    { name: "description", content: "Broker workspace: register employer and employee sign-in accounts with temporary credentials." },
    { name: "robots", content: "noindex" }]

  }),
  component: BrokerAccountsPage
});

function BrokerAccountsPage() {const { t } = useLanguage();
  const { user } = useSession();
  const [status, setStatus] = useState<string | null | "loading">("loading");

  useEffect(() => {
    if (!user) return;
    supabase.
    from("profiles").
    select("verification_status").
    eq("id", user.id).
    maybeSingle().
    then(({ data }) => setStatus(data?.verification_status ?? null));
  }, [user]);

  if (!user) return <div className="py-16 text-center text-muted-foreground">{t("ui.loading")}</div>;

  if (status === "loading") return <div className="py-16 text-center text-muted-foreground">{t("ui.loading")}</div>;

  if (status !== "approved") {
    return (
      <div>
        <BrokerNav />
        <div className="card-soft p-8 text-center">
          <h1 className="text-2xl font-bold">{t("ui.verification.required")}</h1>
          <p className="mt-2 text-muted-foreground">{t("ui.your.broker.account.must.be.verified.before.you.can.cr")}

          </p>
        </div>
      </div>);

  }

  return (
    <div>
      <BrokerNav />
      <h1 className="text-3xl font-bold">{t("ui.create.accounts")}</h1>
      <p className="font-amharic text-muted-foreground">አዲስ መለያ ይፍጠሩ</p>
      <div className="mt-6">
        <UnifiedAccountCreator creatorId={user.id} />
      </div>
    </div>);

}
