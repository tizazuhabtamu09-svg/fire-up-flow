import { useLanguage } from "@/lib/i18n";import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminSection, Metric } from "@/components/admin/shared";
import { useStaff } from "@/components/backoffice/context";
import { kindLabels, loadActivity, loadReviewItems, timeAgo, type ActivityEntry, type ReviewItem, type UserKind } from "@/lib/backoffice";

export const Route = createFileRoute("/backoffice/")({
  component: BackOfficeOverview
});

const KINDS: UserKind[] = ["employee", "employer", "broker", "other"];

function BackOfficeOverview() {const { t } = useLanguage();
  const staff = useStaff();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  const load = useCallback(async () => {
    const [list, log] = await Promise.all([loadReviewItems(), loadActivity(20)]);
    setItems(list);
    setActivity(log);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase.
    channel("backoffice-activity").
    on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => load()).
    on("postgres_changes", { event: "*", schema: "public", table: "workers" }, () => load()).
    on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => load()).
    on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => load()).
    subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const pending = items.filter((i) => i.status === "pending");

  const isKycOnly = staff.kind === "kyc";

  return (
    <AdminSection
      title={`Welcome, ${staff.name.split(" ")[0]}`}
      description={
      isKycOnly ?
      "KYC reviewer console — verify identity documents, approve or decline applicants and keep the queue moving." :
      "Live queue and activity across the platform. Open the document review centre to process anything waiting."
      }>
      
      {isKycOnly &&
      <div className="card-soft mb-6 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("ui.your.privileges")}</p>
          <p className="font-amharic text-sm text-muted-foreground">የሰነድ ማረጋገጫ ኃላፊ</p>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <li>{t("ui.review.submitted.fayda.ids.and.supporting.documents")}</li>
            <li>{t("ui.approve.or.decline.verification.requests")}</li>
            <li>{t("ui.message.applicants.for.missing.information")}</li>
            <li>{t("ui.review.payment.evidence.attached.to.bookings")}</li>
          </ul>
          <Link to="/backoffice/documents" className="btn-brand mt-4 inline-flex">{t("ui.open.document.review")}

        </Link>
        </div>
      }

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Pending verifications" value={pending.length} to="/backoffice/documents" />
        <Metric label="Approved" value={items.filter((i) => i.status === "approved").length} to="/backoffice/documents" />
        <Metric label="Declined" value={items.filter((i) => i.status === "declined").length} to="/backoffice/documents" />
        <Metric label="Total records" value={items.length} to="/backoffice/documents" />
      </div>


      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-bold">{t("ui.pending.queue.by.user.type")}</h2>
          <div className="mt-3 space-y-3">
            {KINDS.map((kind) => {
              const group = pending.filter((i) => i.kind === kind);
              if (group.length === 0) return null;
              return (
                <div key={kind} className="card-soft p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{kindLabels[kind]}</p>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">{group.length}</span>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm">
                    {group.slice(0, 5).map((i) =>
                    <li key={i.key}>
                        <Link to="/backoffice/documents/$id" params={{ id: i.key }} className="text-primary hover:underline">
                          {i.name}
                        </Link>
                        <span className="text-muted-foreground"> · {timeAgo(i.createdAt)}</span>
                      </li>
                    )}
                  </ul>
                  {group.length > 5 &&
                  <Link to="/backoffice/documents" className="mt-2 inline-block text-xs font-semibold text-primary">{t("ui.view.all")}
                    {group.length}
                    </Link>
                  }
                </div>);

            })}
            {pending.length === 0 && <p className="text-muted-foreground">{t("ui.the.verification.queue.is.empty")}</p>}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold">{t("ui.activity.log")}</h2>
          <div className="card-soft mt-3 divide-y divide-border">
            {activity.map((a) =>
            <div key={a.id} className="flex items-start justify-between gap-3 p-3 text-sm">
                <div>
                  <p className="font-semibold">{a.label}</p>
                  <p className="text-muted-foreground">{a.detail}</p>
                </div>
                <span className="whitespace-nowrap text-xs text-muted-foreground">{timeAgo(a.at)}</span>
              </div>
            )}
            {activity.length === 0 && <p className="p-3 text-sm text-muted-foreground">{t("ui.no.activity.yet")}</p>}
          </div>
        </div>
      </div>
    </AdminSection>);

}
