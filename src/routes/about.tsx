import { useLanguage } from "@/lib/i18n";import { createFileRoute, Link } from "@tanstack/react-router";
import { BRAND } from "@/lib/app-config";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
    { title: `About ${BRAND.fullName} — Trusted domestic help in Ethiopia` },
    { name: "description", content: `${BRAND.name} connects households with verified cleaners, babysitters, cooks and skilled workers across Addis Ababa.` },
    { property: "og:title", content: `About ${BRAND.fullName}` },
    { property: "og:description", content: `Why we built ${BRAND.name} and how we verify every worker on the platform.` },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" }]

  }),
  component: AboutPage
});

function AboutPage() {const { t } = useLanguage();
  return (
    <div className="container-page py-16">
      <span className="chip">{t("ui.about.us")}</span>
      <h1 className="mt-4 text-4xl font-bold">{t("ui.about")}{BRAND.name} <span className="font-amharic text-2xl text-muted-foreground">{BRAND.amharic}</span></h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        {BRAND.name}{t("ui.is.a.trust.first.marketplace.connecting.ethiopian.hous")}

      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {[
        { t: "Our mission", d: "Make hiring help safe, fair and transparent for both families and workers." },
        { t: "Verification", d: "Every worker submits Fayda ID front and back, address details and experience before approval." },
        { t: "Fair work", d: "Clear rates, direct communication and no hidden agency fees." }].
        map((c) =>
        <div key={c.t} className="card-soft p-6">
            <h2 className="font-semibold">{c.t}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
          </div>
        )}
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/workers" className="btn-brand">{t("ui.find.workers")}</Link>
        <Link to="/join" className="btn-outline-brand">{t("ui.join")}{BRAND.name}</Link>
      </div>
    </div>);

}
