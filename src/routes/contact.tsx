import { useLanguage } from "@/lib/i18n";import { createFileRoute } from "@tanstack/react-router";
import { CONTACT } from "@/lib/app-config";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
    { title: "Contact Agaze/አጋዝ — Get in touch" },
    { name: "description", content: "Reach the Agaze team by phone, email or message for help with bookings, accounts and verification." },
    { property: "og:title", content: "Contact Agaze/አጋዝ" },
    { property: "og:description", content: "Reach the Agaze team by phone, email or message." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" }]

  }),
  component: ContactPage
});

function ContactPage() {const { t } = useLanguage();
  return (
    <div className="container-page py-16">
      <span className="chip">{t("ui.contact")}</span>
      <h1 className="mt-4 text-4xl font-bold">{t("ui.talk.to.us")}</h1>
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <form
          className="card-soft space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const f = e.currentTarget as HTMLFormElement;
            const data = new FormData(f);
            window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
              `Message from ${String(data.get("name") ?? "")}`
            )}&body=${encodeURIComponent(String(data.get("message") ?? ""))}`;
          }}>
          
          <div>
            <label htmlFor="name" className="text-sm font-medium">{t("ui.full.name")}</label>
            <input id="name" name="name" required className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium">{t("ui.email")}</label>
            <input id="email" name="email" type="email" required className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="message" className="text-sm font-medium">{t("ui.message")}</label>
            <textarea id="message" name="message" rows={5} required className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="btn-brand w-full">{t("ui.send.message")}</button>
        </form>
        <div className="space-y-4">
          <div className="card-soft p-6">
            <h2 className="font-semibold">{t("ui.phone")}</h2>
            <a href={CONTACT.phoneHref} className="text-sm text-primary hover:underline">{CONTACT.phone}</a>
          </div>
          <div className="card-soft p-6">
            <h2 className="font-semibold">{t("ui.email")}</h2>
            <a href={`mailto:${CONTACT.email}`} className="text-sm text-primary hover:underline">{CONTACT.email}</a>
          </div>
          <div className="card-soft p-6">
            <h2 className="font-semibold">{t("ui.office")}</h2>
            <p className="text-sm text-muted-foreground">{t("ui.bole.addis.ababa.ethiopia")}</p>
          </div>
        </div>
      </div>
    </div>);

}
