import { Link } from "@tanstack/react-router";

const links = [
  { to: "/broker", label: "My employees" },
  { to: "/broker/employers", label: "My employers" },
  { to: "/broker/accounts", label: "Create accounts" },
  { to: "/broker/assign", label: "New assignment" },
  { to: "/broker/assignments", label: "Assignment history" },
] as const;

export function BrokerNav() {
  return (
    <nav className="mb-6 flex flex-wrap gap-2 rounded-2xl bg-secondary/60 p-2 text-sm font-semibold">
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          activeOptions={{ exact: l.to === "/broker" }}
          className="rounded-full px-4 py-2 text-muted-foreground transition hover:text-foreground [&.active]:bg-card [&.active]:text-foreground [&.active]:shadow-sm"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
