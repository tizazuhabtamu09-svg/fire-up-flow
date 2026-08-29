import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers at Agaze/አጋዝ — Work with us" },
      { name: "description", content: "Open roles at Agaze and how to join the platform as a worker, employer or broker." },
      { property: "og:title", content: "Careers at Agaze/አጋዝ" },
      { property: "og:description", content: "Open roles at Agaze and how to join the platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CareersPage,
});

const roles = [
  { t: "Field Verification Officer", l: "Addis Ababa · Full-time" },
  { t: "Customer Support (Amharic/English)", l: "Addis Ababa · Full-time" },
  { t: "Community & Partnerships Lead", l: "Hybrid · Full-time" },
];

function CareersPage() {
  return (
    <div className="container-page py-16">
      <span className="chip">Careers</span>
      <h1 className="mt-4 text-4xl font-bold">Build Agaze with us</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        We're a small team making household work safer and better paid. If you want to join the platform as a
        worker instead, use the sign-up flow.
      </p>
      <div className="mt-10 space-y-4">
        {roles.map((r) => (
          <div key={r.t} className="card-soft flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <h2 className="font-semibold">{r.t}</h2>
              <p className="text-sm text-muted-foreground">{r.l}</p>
            </div>
            <Link to="/contact" className="btn-outline-brand text-sm">Apply</Link>
          </div>
        ))}
      </div>
      <div className="mt-10">
        <Link to="/join" className="btn-brand">Join as a worker</Link>
      </div>
    </div>
  );
}
