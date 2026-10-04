import { useLanguage } from "@/lib/i18n";import { createFileRoute, Link } from "@tanstack/react-router";
import { BRAND } from "@/lib/app-config";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
    { title: `Help Center — ${BRAND.fullName}` },
    { name: "description", content: `Answers about booking workers, payments, verification and managing your ${BRAND.name} account.` },
    { property: "og:title", content: `Help Center — ${BRAND.fullName}` },
    { property: "og:description", content: "Answers about booking, payments, verification and accounts." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" }]

  }),
  component: HelpPage
});

const topics = [
{ q: "How do I book a worker?", a: "Browse Find Workers, open a profile and send a booking request. The worker accepts or declines from their dashboard." },
{ q: "How are workers verified?", a: "Workers submit Fayda ID (front and back), full address and experience details, which our team reviews before approval." },
{ q: "How do I pay?", a: "Payment is agreed directly with the worker at the listed hourly or monthly rate. No hidden fees." },
{ q: "How do I change my role or details?", a: "Sign in and open Profile to update your name, phone, city and role." }];


function HelpPage() {const { t } = useLanguage();
  return (
    <div className="container-page py-16">
      <span className="chip">{t("ui.help.center")}</span>
      <h1 className="mt-4 text-4xl font-bold">{t("ui.how.can.we.help")}</h1>
      <div className="mt-10 space-y-4">
        {topics.map((t) =>
        <details key={t.q} className="card-soft p-6">
            <summary className="cursor-pointer font-semibold">{t.q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{t.a}</p>
          </details>
        )}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">{t("ui.still.stuck")}
        <Link to="/contact" className="text-primary hover:underline">{t("ui.contact.support")}</Link>.
      </p>
    </div>);

}
