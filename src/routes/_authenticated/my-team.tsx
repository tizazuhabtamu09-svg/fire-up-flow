import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Star, ShieldAlert, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useProfile } from "@/lib/use-session";
import { RateWorkerModal } from "@/components/employer/RateWorkerModal";
import { IncidentReportModal } from "@/components/employer/IncidentReportModal";
import { TerminateModal } from "@/components/employer/TerminateModal";
import { WorkerHistoryPanel } from "@/components/employer/WorkerHistoryPanel";
import { EmployeeAvatar } from "@/components/EmployeeAvatar";
import { resolveAvatars } from "@/lib/employees";
import { useLanguage } from "@/lib/i18n";
import type { HiredEmployee } from "@/lib/requests";

export const Route = createFileRoute("/_authenticated/my-team")({
  head: () => ({
    meta: [
    { title: "My team — Agaze/አጋዝ" },
    { name: "description", content: "Your active workers: view their registration details, rate performance and file incident reports." },
    { name: "robots", content: "noindex" }]

  }),
  component: MyTeam
});

type PublicProfile = {
  full_name: string;
  sector: string;
  sector_other: string | null;
  city: string | null;
  area: string | null;
  experience: string | null;
  gender: string | null;
  age: number | null;
  photo_url: string | null;
  verification_status: string;
  fayda_verified: boolean | null;
  guarantor_verified: boolean | null;
};

type BrokerWorker = {id: string;full_name: string;sector: string | null;city: string | null;phone: string | null;};
type BrokerEmployer = {id: string;full_name: string;city: string | null;phone: string | null;};

function MyTeam() {
  const { t } = useLanguage();
  const { user } = useSession();
  const { profile } = useProfile(user?.id);
  const isBroker = profile?.role === "broker";
  const [rows, setRows] = useState<HiredEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [rating, setRating] = useState<HiredEmployee | null>(null);
  const [reporting, setReporting] = useState<HiredEmployee | null>(null);
  const [terminating, setTerminating] = useState<HiredEmployee | null>(null);
  const [brokerWorkers, setBrokerWorkers] = useState<BrokerWorker[]>([]);
  const [brokerEmployers, setBrokerEmployers] = useState<BrokerEmployer[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.
    from("hired_employees").
    select("*").
    eq("employer_id", user.id).
    order("created_at", { ascending: false });
    setRows((data ?? []) as HiredEmployee[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user || !isBroker) return;
    let active = true;
    (async () => {
      const [w, e] = await Promise.all([
      supabase.
      from("workers").
      select("id, full_name, sector, city, phone").
      eq("owner_id", user.id).
      eq("verification_status", "approved").
      order("created_at", { ascending: false }),
      supabase.
      from("broker_employers").
      select("id, full_name, city, phone").
      eq("broker_id", user.id).
      eq("verification_status", "approved").
      order("created_at", { ascending: false })]
      );
      if (!active) return;
      setBrokerWorkers((w.data ?? []) as BrokerWorker[]);
      setBrokerEmployers((e.data ?? []) as BrokerEmployer[]);
    })();
    return () => {
      active = false;
    };
  }, [user, isBroker]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("team.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("team.subtitle")}</p>
        </div>
        <Link to="/my-requests" className="btn-outline-brand text-sm">{t("team.myRequests")}</Link>
      </div>

      {isBroker &&
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <section className="card-soft p-5">
            <h2 className="text-lg font-semibold">{t("ui.registered.employees")}</h2>
            <p className="text-xs text-muted-foreground">{t("ui.approved.workers.you.registered")}</p>
            {brokerWorkers.length === 0 ?
          <p className="mt-4 text-sm text-muted-foreground">{t("ui.no.approved.employees.yet")}</p> :

          <ul className="mt-4 space-y-2">
                {brokerWorkers.map((w) =>
            <li key={w.id} className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">{w.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[w.sector, w.city, w.phone].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <Link to="/employee/$id" params={{ id: w.id }} className="btn-outline-brand text-xs">{t("ui.view")}

              </Link>
                  </li>
            )}
              </ul>
          }
          </section>

          <section className="card-soft p-5">
            <h2 className="text-lg font-semibold">{t("ui.registered.employers")}</h2>
            <p className="text-xs text-muted-foreground">{t("ui.approved.employers.you.registered")}</p>
            {brokerEmployers.length === 0 ?
          <p className="mt-4 text-sm text-muted-foreground">{t("ui.no.approved.employers.yet")}</p> :

          <ul className="mt-4 space-y-2">
                {brokerEmployers.map((e) =>
            <li key={e.id} className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">{e.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[e.city, e.phone].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <Link to="/broker/employers" className="btn-outline-brand text-xs">{t("ui.manage")}

              </Link>
                  </li>
            )}
              </ul>
          }
          </section>
        </div>
      }


      {loading ?
      <p className="mt-8 text-muted-foreground">{t("common.loading")}</p> :
      rows.length === 0 ?
      <div className="card-soft mt-8 p-10 text-center">
          <p className="text-muted-foreground">{t("team.empty")}</p>
          <Link to="/workers" className="btn-brand mt-5 inline-block text-sm">{t("team.browseWorkers")}</Link>
        </div> :

      <div className="mt-8 space-y-4">
          {rows.map((h) =>
        <TeamCard
          key={h.id}
          hire={h}
          employerId={user?.id ?? null}
          onTerminate={() => setTerminating(h)}
          open={openId === h.id}
          onToggle={() => setOpenId(openId === h.id ? null : h.id)}
          onRate={() => setRating(h)}
          onReport={() => setReporting(h)} />

        )}
        </div>
      }

      {rating && <RateWorkerModal hire={rating} onClose={() => setRating(null)} />}
      {reporting && <IncidentReportModal hire={reporting} onClose={() => setReporting(null)} />}
      {terminating && user &&
      <TerminateModal
        hire={terminating}
        employerId={user.id}
        onClose={() => setTerminating(null)}
        onSent={load} />

      }
    </div>);

}

function TeamCard({
  hire,
  employerId,
  open,
  onToggle,
  onRate,
  onReport,
  onTerminate








}: {hire: HiredEmployee;employerId: string | null;open: boolean;onToggle: () => void;onRate: () => void;onReport: () => void;onTerminate: () => void;}) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (profile || !hire.worker_ref) return;
    supabase.
    from("workers").
    select("full_name, sector, sector_other, city, area, experience, gender, age, photo_url, verification_status, fayda_number, guarantor_name").
    eq("id", hire.worker_ref).
    maybeSingle().
    then(async ({ data }) => {
      if (!data) return;
      const row = data as Record<string, unknown>;
      setProfile({
        full_name: String(row.full_name ?? ""),
        sector: String(row.sector ?? ""),
        sector_other: row.sector_other as string ?? null,
        city: row.city as string ?? null,
        area: row.area as string ?? null,
        experience: row.experience as string ?? null,
        gender: row.gender as string ?? null,
        age: row.age as number ?? null,
        photo_url: row.photo_url as string ?? null,
        verification_status: String(row.verification_status ?? ""),
        fayda_verified: Boolean(row.fayda_number),
        guarantor_verified: Boolean(row.guarantor_name)
      });
      const path = row.photo_url as string | null;
      if (path) setPhoto((await resolveAvatars([path]))[path] ?? null);
    });
  }, [profile, hire.worker_ref]);

  return (
    <div className="card-soft p-5">
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <button onClick={onToggle} className="flex flex-1 items-center gap-3 text-left">
          <EmployeeAvatar photoUrl={photo} name={hire.worker_name} className="h-11 w-11 rounded-2xl" />
          <div>
            <p className="font-semibold">{hire.worker_name}</p>
            <p className="text-sm text-muted-foreground">
              {hire.sector ?? t("team.worker")}
              {hire.salary ? ` · ETB ${Number(hire.salary).toLocaleString()} / ${t("team.month")}` : ""}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            {hire.status === "terminated" ? t("team.terminated") : t("team.active")}
          </span>
          {hire.status !== "terminated" &&
          <button
            onClick={onTerminate}
            className="inline-flex items-center gap-1.5 rounded-full border border-destructive px-3 py-1.5 text-xs font-semibold text-destructive">
            
              <UserMinus className="h-3.5 w-3.5" /> {t("team.terminate")}
            </button>
          }
        </div>
      </div>

      {open &&
      <div className="mt-4 rounded-2xl bg-secondary/50 p-4">
          <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">{t("team.registrationDetails")}</p>
          {hire.worker_ref && !profile ?
        <p className="text-sm text-muted-foreground">{t("team.loadingProfile")}</p> :

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Row label={t("team.fullName")} value={profile?.full_name ?? hire.worker_name} />
              <Row label={t("team.sector")} value={profile?.sector_other || profile?.sector || hire.sector} />
              <Row label={t("team.city")} value={profile?.city} />
              <Row label={t("team.area")} value={profile?.area} />
              <Row label={t("team.gender")} value={profile?.gender} />
              <Row label={t("team.age")} value={profile?.age ? String(profile.age) : null} />
              <Row label={t("team.experience")} value={profile?.experience} />
              <Row label={t("team.verification")} value={profile?.verification_status} />
              <Row label={t("team.faydaVerified")} value={profile ? profile.fayda_verified ? t("common.yes") : t("common.no") : null} />
              <Row label={t("team.guarantorVerified")} value={profile ? profile.guarantor_verified ? t("common.yes") : t("common.no") : null} />
            </dl>
        }

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={onRate} className="btn-brand inline-flex items-center gap-1.5 text-xs">
              <Star className="h-3.5 w-3.5" /> {t("team.rateWorker")}
            </button>
            <button onClick={onReport} className="btn-outline-brand inline-flex items-center gap-1.5 text-xs">
              <ShieldAlert className="h-3.5 w-3.5" /> {t("team.submitIncident")}
            </button>
            {hire.status !== "terminated" &&
          <button
            onClick={onTerminate}
            className="inline-flex items-center gap-1.5 rounded-full border border-destructive px-4 py-2 text-xs font-semibold text-destructive">
            
                <UserMinus className="h-3.5 w-3.5" /> {t("team.terminateEmployee")}
              </button>
          }
          </div>

          <div className="mt-6 border-t border-border pt-4">
            <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">{t("team.activityLog")}</p>
            <WorkerHistoryPanel
            hiredId={hire.id}
            workerRef={hire.worker_ref}
            workerName={hire.worker_name}
            ownerId={employerId}
            viewerId={employerId}
            asStaff={false} />
          
          </div>
        </div>
      }
    </div>);

}

function Row({ label, value }: {label: string;value: string | null | undefined;}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd>{value || "—"}</dd>
    </div>);

}
