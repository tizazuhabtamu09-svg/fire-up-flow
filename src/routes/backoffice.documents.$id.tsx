import { useLanguage } from "@/lib/i18n";import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AdminSection, adminInput } from "@/components/admin/shared";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { FeedbackChat } from "@/components/backoffice/FeedbackChat";
import { useStaff } from "@/components/backoffice/context";
import { openSigned } from "@/lib/uploads";
import { decideVerification, kindLabels, loadReviewItem, timeAgo, type ReviewItem } from "@/lib/backoffice";
import type { VerificationStatus } from "@/lib/use-session";

export const Route = createFileRoute("/backoffice/documents/$id")({
  component: DocumentDetail
});

function DocumentDetail() {const { t } = useLanguage();
  const { id } = useParams({ from: "/backoffice/documents/$id" });
  const staff = useStaff();
  const [item, setItem] = useState<ReviewItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const found = await loadReviewItem(id);
    setItem(found);
    setNote(found?.note ?? "");
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(status: VerificationStatus) {
    if (!item) return;
    setBusy(true);
    setError(null);
    const { error: err } = await decideVerification(item, status, note.trim() || null);
    setBusy(false);
    if (err) return setError(err.message);
    setItem({ ...item, status, note: note.trim() || null });
  }

  if (loading) return <p className="text-muted-foreground">{t("ui.loading.record")}</p>;

  if (!item) {
    return (
      <div className="card-soft p-10 text-center">
        <h1 className="text-xl font-bold">{t("ui.record.not.found")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("ui.this.link.points.to.a.record.that.no.longer.exists")}</p>
        <Link to="/backoffice/documents" className="btn-brand mt-5 inline-block text-sm">{t("ui.back.to.review.centre")}</Link>
      </div>);

  }

  return (
    <AdminSection title={item.name} description={`${kindLabels[item.kind]} · ${item.subtitle} · submitted ${timeAgo(item.createdAt)}`}>
      <Link to="/backoffice/documents" className="text-sm font-semibold text-primary">{t("ui.back.to.review.centre.2")}</Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="card-soft p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">{t("ui.documents")}</h2>
            <VerifiedBadge status={item.status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.docs.map((d) =>
            <button key={d.label} onClick={() => openSigned(d.bucket, d.path)} className="btn-outline-brand text-xs">
                {d.label}
              </button>
            )}
            {item.docs.length === 0 && <p className="text-sm text-muted-foreground">{t("ui.no.documents.uploaded.yet")}</p>}
          </div>

          <label className="mt-5 block text-sm font-semibold">{t("ui.decision.note.shown.to.the.user")}

            <textarea
              className={`${adminInput} mt-1 min-h-24 font-normal`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("ui.explain.what.is.missing.or.why.this.was.approved")} />
            
          </label>

          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => decide("approved")} className="btn-brand text-sm disabled:opacity-60">{t("ui.approve")}

            </button>
            <button disabled={busy} onClick={() => decide("declined")} className="btn-outline-brand text-sm disabled:opacity-60">{t("ui.decline")}

            </button>
          </div>
        </div>

        <div className="card-soft p-5">
          <h2 className="text-base font-bold">{t("ui.feedback.chat")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("ui.messages.here.appear.in.the.applicant.s.inbox.and.thei")}

          </p>
          <div className="mt-4">
            <FeedbackChat
              ownerId={item.ownerId}
              source={item.source}
              subjectId={item.id}
              name={item.name}
              viewerId={staff.userId}
              asStaff />
            
          </div>
        </div>
      </div>
    </AdminSection>);

}
