import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useProfile, roleLabels } from "@/lib/use-session";
import { useActiveSubscription, benefitLines, daysLeft } from "@/lib/subscriptions";
import { notifyExpiringSubscription } from "@/lib/notifications";
import { WalletBar } from "@/components/WalletBar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useLanguage } from "@/lib/i18n";
import type { Database } from "@/integrations/supabase/types";

type Booking = Database["public"]["Tables"]["bookings"]["Row"];

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Agaze/አጋዝ" },
      { name: "description", content: "Your Agaze dashboard: bookings, requests and account activity." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useLanguage();
  const { user } = useSession();
  const { profile } = useProfile(user?.id);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [myWorkerId, setMyWorkerId] = useState<string | null>(null);

  const isWorker = profile?.role === "employee";

  useEffect(() => {
    if (!user) return;
    const col = isWorker ? "worker_id" : "employer_id";
    supabase
      .from("bookings")
      .select("*")
      .eq(col, user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setBookings(data ?? []);
        setLoading(false);
      });
  }, [user, isWorker]);

  // Lazily raises the "subscription ending soon" notification once per period.
  useEffect(() => {
    if (user) void notifyExpiringSubscription(user.id);
  }, [user]);

  // Employees get a direct link to their own (read-only) profile page.
  useEffect(() => {
    if (!user || !isWorker) return;
    supabase
      .from("workers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setMyWorkerId(data?.id ?? null));
  }, [user, isWorker]);

  async function setStatus(id: string, status: Booking["status"]) {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (!error) setBookings((b) => b.map((x) => (x.id === id ? { ...x, status } : x)));
  }

  const pending = bookings.filter((b) => b.status === "pending").length;
  const accepted = bookings.filter((b) => b.status === "accepted").length;
  const completed = bookings.filter((b) => b.status === "completed").length;

  return (
    <div>
      <WalletBar balance={profile?.wallet_balance} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {profile?.full_name
              ? t("dash.welcomeName", { name: profile.full_name.split(" ")[0] })
              : t("dash.welcome")}
          </h1>
          <p className="font-amharic text-muted-foreground">
            {profile ? roleLabels[profile.role].am : "እንኳን ደህና መጡ"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isWorker ? (
            <>
              {myWorkerId && (
                <Link to="/employee/$id" params={{ id: myWorkerId }} className="btn-brand text-sm">{t("dash.myProfile")}</Link>
              )}
              <Link to="/my-applications" className="btn-outline-brand text-sm">My applications</Link>
              <Link to="/update-profile" className="btn-outline-brand text-sm">Update profile</Link>
              <Link to="/jobs" className="btn-outline-brand text-sm">Browse jobs</Link>
              <Link to="/profile" className="btn-outline-brand text-sm">{t("dash.accountSettings")}</Link>
            </>
          ) : (
            <>
              <Link to="/workers" className="btn-brand text-sm">{t("dash.findWorkers")}</Link>
              <Link to="/my-jobs" className="btn-outline-brand text-sm">My Job Posts</Link>
              <Link to="/my-requests" className="btn-outline-brand text-sm">{t("dash.myRequests")}</Link>
              <Link to="/my-team" className="btn-outline-brand text-sm">{t("dash.myTeam")}</Link>
            </>
          )}
        </div>
      </div>

      {profile && profile.verification_status !== "approved" && (
        <div className="card-soft mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              {t("dash.accountVerification")} <VerifiedBadge status={profile.verification_status} />
            </p>
            <p className="text-sm text-muted-foreground">
              {profile.verification_status === "declined"
                ? profile.verification_note ?? t("dash.declinedNote")
                : isWorker
                  ? t("dash.pendingWorkerNote")
                  : profile.role === "broker"
                    ? t("dash.pendingBrokerNote")
                    : t("dash.pendingOtherNote")}
            </p>
          </div>
          <Link to="/profile" className="btn-outline-brand text-sm">{t("dash.manageDocuments")}</Link>
          <Link to="/verification" className="btn-outline-brand text-sm">{t("dash.documentReviewChat")}</Link>
        </div>
      )}

      <SubscriptionCard userId={user?.id} />

      {isWorker && <MyApplicationsCard userId={user?.id} />}


      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label={isWorker ? t("dash.newRequests") : t("dash.pendingBookings")} value={pending} />
        <Stat label={t("dash.active")} value={accepted} />
        <Stat label={t("dash.completed")} value={completed} />
      </div>

      <h2 className="mt-10 text-xl font-bold">{isWorker ? t("dash.incomingRequests") : t("dash.recentBookings")}</h2>
      {loading ? (
        <p className="mt-4 text-muted-foreground">{t("common.loading")}</p>
      ) : bookings.length === 0 ? (
        <div className="card-soft mt-4 p-10 text-center">
          <p className="text-muted-foreground">
            {isWorker ? t("dash.noRequestsYet") : t("dash.noBookingsYet")}
          </p>
          {!isWorker && <Link to="/workers" className="btn-brand mt-5 inline-block text-sm">{t("dash.browseWorkers")}</Link>}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {bookings.slice(0, 6).map((b) => (
            <div key={b.id} className="card-soft flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-semibold">{b.service}</p>
                <p className="text-sm text-muted-foreground">
                  {b.worker_name ? `${b.worker_name} · ` : ""}
                  {b.scheduled_date ?? t("dash.dateToConfirm")}
                  {b.address ? ` · ${b.address}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={b.status} />
                {isWorker && b.status === "pending" && (
                  <>
                    <button onClick={() => setStatus(b.id, "accepted")} className="btn-brand text-xs">{t("dash.accept")}</button>
                    <button onClick={() => setStatus(b.id, "declined")} className="btn-outline-brand text-xs">{t("dash.decline")}</button>
                  </>
                )}
                {isWorker && b.status === "accepted" && (
                  <button onClick={() => setStatus(b.id, "completed")} className="btn-outline-brand text-xs">{t("dash.markComplete")}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const APPLICATION_STAGE: Record<string, { label: string; tone: string }> = {
  pending: { label: "Received", tone: "bg-secondary text-muted-foreground" },
  reviewing: { label: "Under review", tone: "bg-primary/10 text-primary" },
  shortlisted: { label: "Shortlisted", tone: "bg-primary/15 text-primary" },
  hired: { label: "Hired", tone: "bg-primary/20 text-primary" },
  rejected: { label: "Not selected", tone: "bg-destructive/10 text-destructive" },
};

type ApplicationRow = {
  id: string;
  job_id: string;
  status: string;
  created_at: string;
  profile_complete: boolean | null;
  job?: { title: string | null; employer_name: string | null; city: string | null } | null;
};

/** Employee dashboard: the jobs this person applied to and where each one stands. */
function MyApplicationsCard({ userId }: { userId?: string }) {
  const [rows, setRows] = useState<ApplicationRow[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    supabase
      .from("job_applications")
      .select("id, job_id, status, created_at, profile_complete, job:job_posts(title, employer_name, city)")
      .eq("applicant_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) setRows((data as ApplicationRow[]) ?? []);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  if (rows === null) return null;

  const incomplete = rows.some((r) => !r.profile_complete);

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">My job applications</h2>
          <p className="font-amharic text-xs text-muted-foreground">ያመለከትኳቸው ስራዎች</p>
        </div>
        <Link to="/my-applications" className="btn-outline-brand text-xs">View all</Link>
      </div>

      {incomplete && (
        <div className="card-soft mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm">
            Finish your employee profile so employers can see your full details and verify you.
          </p>
          <Link to="/update-profile" className="btn-brand text-sm">Update profile</Link>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card-soft mt-4 flex flex-wrap items-center justify-between gap-3 p-6">
          <p className="text-sm text-muted-foreground">You have not applied to any job yet.</p>
          <Link to="/jobs" className="btn-brand text-xs">Browse open jobs</Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.slice(0, 5).map((r) => {
            const stage = APPLICATION_STAGE[r.status] ?? APPLICATION_STAGE.pending;
            return (
              <div key={r.id} className="card-soft flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <Link to="/jobs/$id" params={{ id: r.job_id }} className="font-semibold hover:underline">
                    {r.job?.title ?? "Job"}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {[r.job?.employer_name, r.job?.city].filter(Boolean).join(" \u00b7 ") || "Employer"} \u00b7{" "}
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stage.tone}`}>{stage.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Active-plan entitlement card: plan name, time left and granted benefits. */
function SubscriptionCard({ userId }: { userId?: string }) {
  const { subscription, loading } = useActiveSubscription(userId);
  if (loading || !subscription) return null;
  const left = daysLeft(subscription);
  const benefits = benefitLines(subscription);
  return (
    <div className="card-soft mt-6 flex flex-wrap items-center justify-between gap-3 border-primary/30 p-5">
      <div>
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          {subscription.package?.name ?? "Subscription"}
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${left <= 5 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
            {left} day{left === 1 ? "" : "s"} left
          </span>
        </p>
        {benefits.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">{benefits.join(" · ")}</p>
        )}
      </div>
      <Link to="/notifications" className="btn-outline-brand text-sm">View updates</Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-soft p-6">
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const { t } = useLanguage();
  const tone: Record<string, string> = {
    pending: "bg-secondary text-muted-foreground",
    accepted: "bg-primary/15 text-primary",
    completed: "bg-primary/10 text-foreground",
    declined: "bg-destructive/10 text-destructive",
    cancelled: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${tone[status] ?? "bg-secondary"}`}>
      {t(`status.${status}`) !== `status.${status}` ? t(`status.${status}`) : status}
    </span>
  );
}
