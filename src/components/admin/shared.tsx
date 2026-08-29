import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export const adminInput =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

export function AdminSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

/**
 * Summary tile. When `to` is given the whole tile becomes a link to the
 * detailed page for that number.
 */
export function Metric({
  label,
  value,
  to,
  search,
}: {
  label: string;
  value: number | string;
  to?: string;
  search?: Record<string, string>;
}) {
  const body = (
    <>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </>
  );
  if (!to) return <div className="card-soft p-5">{body}</div>;
  return (
    <Link
      {...({ to, search } as unknown as { to: "/" })}
      className="card-soft block p-5 transition hover:border-primary/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {body}
    </Link>
  );
}
