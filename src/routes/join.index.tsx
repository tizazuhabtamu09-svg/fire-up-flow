import { useLanguage } from "@/lib/i18n";import { createFileRoute, Link } from "@tanstack/react-router";
import { BRAND } from "@/lib/app-config";
import { Steps } from "@/routes/join.credentials";

export const Route = createFileRoute("/join/")({
  head: () => ({
    meta: [
    { title: `Join ${BRAND.fullName} — Choose your role` },
    { name: "description", content: `Join ${BRAND.name} as an employee, employer, or broker. Choose the path that fits you.` },
    { property: "og:title", content: `Join ${BRAND.fullName}` },
    { property: "og:description", content: "Sign up as employee, employer, or broker." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" }]

  }),
  component: JoinPage
});

const roles = [
{
  to: "/join/employee" as const,
  icon: "🧑‍🔧",
  title: "Employee",
  amharic: "ሰራተኛ",
  desc: "Looking for work? Join as a domestic or skilled worker."
},
{
  to: "/join/employer" as const,
  icon: "🏠",
  title: "Employer",
  amharic: "ቀጣሪ",
  desc: "Need help at home? Hire trusted workers near you."
},
{
  to: "/join/broker" as const,
  icon: "🤝",
  title: "Broker",
  amharic: "ደላላ",
  desc: "Connect workers with employers and earn commissions."
}];


function JoinPage() {const { t } = useLanguage();
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-3xl">
        <Steps current={1} />
      </div>
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold md:text-5xl">{t("ui.join")}{BRAND.name}</h1>
        <p className="mt-3 font-amharic text-lg text-muted-foreground">{BRAND.amharic}ን ይቀላቀሉ</p>
        <p className="mt-4 text-muted-foreground">{t("ui.choose.how.you.d.like.to.get.started")}</p>
      </div>
      <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
        {roles.map((r) =>
        <Link
          key={r.to}
          to={r.to}
          className="card-soft group flex flex-col items-center p-8 text-center transition hover:-translate-y-1">
          
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl" style={{ background: "var(--gradient-brand)" }}>
              {r.icon}
            </div>
            <h2 className="mt-5 text-2xl font-bold">{r.title}</h2>
            <p className="font-amharic text-sm text-muted-foreground">{r.amharic}</p>
            <p className="mt-3 text-sm text-muted-foreground">{r.desc}</p>
            <span className="mt-6 text-sm font-semibold" style={{ color: "var(--brand-dark)" }}>{t("ui.continue.2")}

          </span>
          </Link>
        )}
      </div>
    </div>);

}
