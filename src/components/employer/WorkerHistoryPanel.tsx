import { useLanguage } from "@/lib/i18n";import { useCallback, useEffect, useState } from "react";
import { Star, ShieldAlert, MessageSquare, UserMinus } from "lucide-react";
import { loadWorkerHistory, type WorkerHistory } from "@/lib/employees";
import { reportTitle } from "@/lib/requests";
import { FeedbackChat } from "@/components/backoffice/FeedbackChat";

/**
 * Unified audit & activity log for one placed employee: ratings, incident
 * reports with their official responses, termination requests and the
 * bi-directional employer ↔ back-office message thread.
 */
export function WorkerHistoryPanel({
  hiredId,
  workerRef,
  workerName,
  ownerId,
  viewerId,
  asStaff







}: {hiredId: string | null;workerRef: string | null;workerName: string;ownerId: string | null;viewerId: string | null;asStaff: boolean;}) {const { t } = useLanguage();
  const [history, setHistory] = useState<WorkerHistory | null>(null);

  const load = useCallback(async () => {
    setHistory(await loadWorkerHistory({ workerRef, hiredId, workerName }));
  }, [workerRef, hiredId, workerName]);

  useEffect(() => {
    load();
  }, [load]);

  if (!history) return <p className="text-sm text-muted-foreground">{t("ui.loading.activity.log")}</p>;

  return (
    <div className="space-y-5">
      <Section icon={<Star className="h-4 w-4" />} title={t("ui.performance.ratings")}>
        {history.ratings.length === 0 ?
        <Empty>{t("ui.no.ratings.recorded.yet")}</Empty> :

        history.ratings.map((r) =>
        <li key={r.id} className="rounded-xl bg-card p-3 text-sm">
              <p className="font-semibold">
                {"★".repeat(r.rating)}
                <span className="text-muted-foreground">{"★".repeat(5 - r.rating)}</span>
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </p>
              {r.review && <p className="mt-1 text-muted-foreground">{r.review}</p>}
            </li>
        )
        }
      </Section>

      <Section icon={<ShieldAlert className="h-4 w-4" />} title={t("ui.incident.reports.responses")}>
        {history.incidents.length === 0 ?
        <Empty>{t("ui.no.incident.reports.filed")}</Empty> :

        history.incidents.map((i) =>
        <li key={i.id} className="rounded-xl bg-card p-3 text-sm">
              <p className="font-semibold">
                {reportTitle(i.category)}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {new Date(i.created_at).toLocaleString()} · {i.status}
                </span>
              </p>
              <dl className="mt-1 space-y-0.5 text-muted-foreground">
                {Object.entries((i.details ?? {}) as Record<string, string>).map(([k, v]) =>
            <div key={k}>
                    <span className="capitalize">{k.replaceAll("_", " ")}</span>: {String(v)}
                  </div>
            )}
              </dl>
              {i.admin_response &&
          <p className="mt-2 rounded-lg bg-secondary p-2">
                  <span className="font-semibold">{t("ui.official.response")}</span>
                  {i.admin_response}
                </p>
          }
            </li>
        )
        }
      </Section>

      <Section icon={<UserMinus className="h-4 w-4" />} title={t("ui.termination.requests")}>
        {history.terminations.length === 0 ?
        <Empty>{t("ui.no.termination.requests")}</Empty> :

        history.terminations.map((term) =>
        <li key={term.id} className="rounded-xl bg-card p-3 text-sm">
              <p className="font-semibold">
                {term.reason}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {new Date(term.created_at).toLocaleDateString()} · {term.status}
                </span>
              </p>
              {term.details && <p className="mt-1 text-muted-foreground">{term.details}</p>}
              {term.admin_note &&
          <p className="mt-2 rounded-lg bg-secondary p-2">
                  <span className="font-semibold">{t("ui.back.office")}</span>
                  {term.admin_note}
                </p>
          }
              {term.status === "approved" &&
          <p className="mt-1 text-xs text-muted-foreground">{t("ui.worker.marked")}
            {term.make_available ? "available" : "unavailable"}{t("ui.for.future.placement")}
          </p>
          }
            </li>
        )
        }
      </Section>

      {hiredId && ownerId &&
      <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <MessageSquare className="h-4 w-4" />{t("ui.back.office.message.history")}
        </h4>
          <FeedbackChat
          ownerId={ownerId}
          source="employee"
          subjectId={hiredId}
          name={workerName}
          viewerId={viewerId}
          asStaff={asStaff} />
        
        </div>
      }
    </div>);

}

function Section({ icon, title, children }: {icon: React.ReactNode;title: string;children: React.ReactNode;}) {
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">{icon} {title}</h4>
      <ul className="space-y-2">{children}</ul>
    </div>);

}

function Empty({ children }: {children: React.ReactNode;}) {
  return <li className="text-sm text-muted-foreground">{children}</li>;
}
