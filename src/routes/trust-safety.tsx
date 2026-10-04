import { useLanguage } from "@/lib/i18n";import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/trust-safety")({
  head: () => ({
    meta: [
    { title: "Trust & Safety — Agaze/አጋዝ" },
    { name: "description", content: "How Agaze verifies workers, protects ID documents and keeps households safe." },
    { property: "og:title", content: "Trust & Safety — Agaze/አጋዝ" },
    { property: "og:description", content: "Verification, document privacy and safety standards at Agaze." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" }]

  }),
  component: TrustPage
});

const pillars = [
{ t: "Identity verification", d: "Fayda number plus front and back ID photos are required for every worker application." },
{ t: "Private document storage", d: "ID images are stored in a private bucket. Only the owner and our review team can access them." },
{ t: "Reviews & ratings", d: "Households rate completed jobs, so quality is visible before you book." },
{ t: "Report & resolve", d: "Any safety concern can be reported to support and is reviewed within 24 hours." }];


function TrustPage() {const { t } = useLanguage();
  return (
    <div className="container-page py-16">
      <span className="chip">{t("ui.trust.safety")}</span>
      <h1 className="mt-4 text-4xl font-bold">{t("ui.safety.is.the.product")}</h1>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {pillars.map((p) =>
        <div key={p.t} className="card-soft p-6">
            <h2 className="font-semibold">{p.t}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
          </div>
        )}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">{t("ui.need.to.report.something")}
        <Link to="/contact" className="text-primary hover:underline">{t("ui.contact.us")}</Link>.
      </p>
    </div>);

}
