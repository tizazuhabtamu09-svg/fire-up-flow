import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminSection, adminInput } from "@/components/admin/shared";
import { ChangeRequestQueue } from "@/components/admin/ChangeRequestQueue";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { openSigned } from "@/lib/uploads";
import { kindLabels, loadReviewItems, timeAgo, type ReviewItem, type UserKind } from "@/lib/backoffice";
import type { VerificationStatus } from "@/lib/use-session";

export const Route = createFileRoute("/backoffice/documents/")({
  component: DocumentReviewCenter,
});

const STATUSES: (VerificationStatus | "all")[] = ["pending", "approved", "declined", "all"];
const KIND_FILTERS: (UserKind | "all")[] = ["all", "employee", "employer", "broker", "admin", "kyc"];

function DocumentReviewCenter() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [status, setStatus] = useState<VerificationStatus | "all">("pending");
  const [kind, setKind] = useState<UserKind | "all">("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await loadReviewItems());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(
    () =>
      items.filter(
        (i) =>
          (status === "all" || i.status === status) &&
          (kind === "all" || i.kind === kind) &&
          (q.trim() === "" || i.name.toLowerCase().includes(q.trim().toLowerCase())),
      ),
    [items, status, kind, q],
  );

  return (
    <AdminSection
      title="Document review centre"
      description="Every submitted identity document, filterable by approval status and user type. Open a record to approve, decline and chat with the applicant."
    >
      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${
              status === s ? "border-primary bg-secondary" : "border-border text-muted-foreground"
            }`}
          >
            {s}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-border" />
        {KIND_FILTERS.map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              kind === k ? "border-primary bg-secondary" : "border-border text-muted-foreground"
            }`}
          >
            {k === "all" ? "All types" : kindLabels[k]}
          </button>
        ))}
        <input
          className={`${adminInput} max-w-xs`}
          placeholder="Search by name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mt-5 space-y-3">
        {loading && <p className="text-muted-foreground">Loading records…</p>}
        {!loading &&
          shown.map((item) => (
            <div key={item.key} className="card-soft p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {item.name} <VerifiedBadge status={item.status} />
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{kindLabels[item.kind]}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.subtitle} · {item.docs.length} document{item.docs.length === 1 ? "" : "s"} · {timeAgo(item.createdAt)}
                  </p>
                  {item.note && <p className="mt-1 text-sm text-muted-foreground">Note: {item.note}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {item.docs.map((d) => (
                    <button key={d.label} onClick={() => openSigned(d.bucket, d.path)} className="btn-outline-brand text-xs">
                      {d.label}
                    </button>
                  ))}
                  <Link to="/backoffice/documents/$id" params={{ id: item.key }} className="btn-brand text-xs">
                    Review
                  </Link>
                </div>
              </div>
            </div>
          ))}
        {!loading && shown.length === 0 && <p className="text-muted-foreground">Nothing matches these filters.</p>}
      </div>

      <div className="mt-10 border-t border-border pt-8">
        <ChangeRequestQueue />
      </div>
    </AdminSection>
  );
}
