import { createFileRoute, Link } from "@tanstack/react-router";
import { BRAND } from "@/lib/app-config";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: `Terms & Privacy — ${BRAND.fullName}` },
      { name: "description", content: `Terms of use and privacy practices for the ${BRAND.name} domestic work platform.` },
      { property: "og:title", content: `Terms & Privacy — ${BRAND.fullName}` },
      { property: "og:description", content: `Terms of use and privacy practices for ${BRAND.name}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermsPage,
});

const sections = [
  { t: `1. Using ${BRAND.name}`, d: `${BRAND.name} is a marketplace that introduces households to workers. Work agreements are made directly between the two parties.` },
  { t: "2. Accounts", d: "You must provide accurate information. Accounts with false identity details are removed." },
  { t: "3. Payments", d: `Rates shown are set by workers. ${BRAND.name} does not hold funds between parties.` },
  { t: "4. Privacy", d: "We collect only the data needed to verify identity and enable bookings. ID documents are stored privately and never shown publicly." },
  { t: "5. Termination", d: "We may suspend accounts that breach these terms or our safety standards." },
];

function TermsPage() {
  return (
    <div className="container-page py-16">
      <span className="chip">Legal</span>
      <h1 className="mt-4 text-4xl font-bold">Terms & Privacy</h1>
      <div className="mt-10 max-w-3xl space-y-6">
        {sections.map((s) => (
          <section key={s.t}>
            <h2 className="font-semibold">{s.t}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
          </section>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Questions? <Link to="/contact" className="text-primary hover:underline">Contact us</Link>.
      </p>
    </div>
  );
}
