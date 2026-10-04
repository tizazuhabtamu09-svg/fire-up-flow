import { useLanguage } from "@/lib/i18n";import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, MapPin, ShieldCheck, Star } from "lucide-react";
import { loadPublicEmployee, type PublicEmployee } from "@/lib/employee-request";
import { AdminOriginTag } from "@/components/admin/AdminOriginTag";
import { EditUserProfileModal } from "@/components/admin/EditUserProfileModal";
import { ProfileDocuments } from "@/components/ProfileDocuments";
import { RequestEditModal } from "@/components/RequestEditModal";
import { loadChangeRequestsFor, fieldLabel, type ChangeRequest } from "@/lib/change-requests";
import { useSession, useProfile, useRoleFlags } from "@/lib/use-session";
import { money, sectorLabel } from "@/lib/app-config";
import {
  loadWorkerRecord,
  resolveAccess,
  setWorkerAvailability,
  workerPhotoUrl,
  type WorkerRecord } from
"@/lib/employee-profile";

export const Route = createFileRoute("/employee/$id")({
  ssr: false,
  head: () => ({
    meta: [
    { title: "Employee profile — Agaze/አጋዝ" },
    { name: "description", content: "Verified worker profile with experience, skills, availability and rate. Request this employee for your household or business." },
    { property: "og:title", content: "Employee profile — Agaze/አጋዝ" },
    { property: "og:description", content: "Verified worker profile with experience, skills, availability and rate." },
    { property: "og:type", content: "profile" },
    { name: "twitter:card", content: "summary" }]

  }),
  component: EmployeeProfile
});

function EmployeeProfile() {const { t } = useLanguage();
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useSession();
  const { profile } = useProfile(user?.id);
  const { isAdmin } = useRoleFlags(user?.id);

  const [worker, setWorker] = useState<PublicEmployee | null>(null);
  const [record, setRecord] = useState<WorkerRecord | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [editing, setEditing] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);

  const refreshRequests = () => loadChangeRequestsFor(id).then(setChangeRequests);

  useEffect(() => {
    let active = true;
    Promise.all([loadPublicEmployee(id), loadWorkerRecord(id)]).then(async ([pub, row]) => {
      if (!active) return;
      setWorker(pub);
      setRecord(row);
      setLoading(false);
      // loadPublicEmployee already returns a signed URL; the raw record keeps a storage path.
      const url = pub?.photoUrl ?? (await workerPhotoUrl(row?.photo_url));
      if (active) setPhoto(url);
    });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    loadChangeRequestsFor(id).then((rows) => {
      if (active) setChangeRequests(rows);
    });
    return () => {
      active = false;
    };
  }, [id, user]);

  const access = resolveAccess({ worker: record, userId: user?.id, role: profile?.role, isAdmin });
  const canAdminEdit = isAdmin && Boolean(record);

  if (loading) return <div className="container-page py-20 text-center text-muted-foreground">{t("ui.loading.profile")}</div>;

  if (!worker && !record) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold">{t("ui.worker.not.found")}</h1>
        <Link to="/workers" className="btn-brand mt-6 inline-block">{t("ui.back.to.browse")}</Link>
      </div>);

  }

  const name = worker?.name ?? record?.full_name ?? "Worker";
  const roleLabel = worker?.role ?? sectorLabel(record?.sector ?? "", record?.sector_other ?? null);
  const available = record ? Boolean(record.available) : Boolean(worker?.available);
  const city = worker?.city ?? record?.city ?? "";
  const area = worker?.area ?? record?.area ?? "";
  const allSectors: string[] = Array.from(
    new Set([
    ...(worker?.sectors ?? []),
    ...((record as {sectors?: string[];} | null)?.sectors ?? []).filter(Boolean)]
    )
  );
  const education = worker?.education ?? record?.education ?? null;
  const educationInstitution = worker?.educationInstitution ?? record?.education_institution ?? null;
  const educationQualification = worker?.educationQualification ?? record?.education_qualification ?? null;
  const educationGraduationYear =
  worker?.educationGraduationYear ?? record?.education_graduation_year ?? null;
  const hasEducation = Boolean(education || educationInstitution || educationQualification || educationGraduationYear);
  const faydaVerified = record ? Boolean(record.fayda_verified) : Boolean(worker?.faydaVerified);
  const guarantorVerified = record ? Boolean(record.guarantor_verified) : Boolean(worker?.guarantorVerified);

  async function toggleAvailability() {
    if (!record) return;
    setSavingAvailability(true);
    try {
      const next = !record.available;
      await setWorkerAvailability(record.id, next);
      setRecord({ ...record, available: next });
    } finally {
      setSavingAvailability(false);
    }
  }

  return (
    <div style={{ background: "var(--gradient-warm)" }}>
      <div className="container-page py-10">
        <button onClick={() => window.history.back()} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />{t("ui.back")}
        </button>

        <div className="mx-auto mt-4 max-w-3xl">
          <div className="card-soft overflow-hidden">
            <div className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start" style={{ background: "var(--brand-soft)" }}>
              {photo ?
              <img src={photo} alt={`${name}, ${roleLabel}`} className="h-24 w-24 rounded-2xl object-cover" /> :

              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-background text-5xl">
                  {worker?.avatar ?? (record?.gender === "male" ? "🧑🏾" : "👩🏾")}
                </div>
              }
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold">{name}</h1>
                <div className="mt-1"><AdminOriginTag table="workers" id={id} /></div>
                <p className="text-sm font-semibold" style={{ color: "var(--brand-dark)" }}>{roleLabel}</p>
                {allSectors.length > 1 &&
                <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                    {allSectors.map((s) =>
                  <span key={s} className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold">
                        {sectorLabel(s, s)}
                      </span>
                  )}
                  </div>
                }
                {worker &&
                <div className="mt-2 flex items-center justify-center gap-1 text-sm sm:justify-start">
                    <Star className="h-4 w-4 fill-current" style={{ color: "var(--brand)" }} />
                    <span className="font-semibold">{worker.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({worker.reviews}{t("ui.reviews")}</span>
                  </div>
                }
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground sm:justify-start">
                  <MapPin className="h-3.5 w-3.5" />{[area, city].filter(Boolean).join(", ")}
                </div>
              </div>
              <div className="sm:ml-auto">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  available ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`
                  }>
                  
                  <span className={`h-2 w-2 rounded-full ${available ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                  {available ? "Available now" : "Currently unavailable"}
                </span>
              </div>
            </div>

            {/* Verification badges — visible to every viewer */}
            <div className="flex flex-wrap gap-2 border-b border-border p-5">
              {faydaVerified &&
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <BadgeCheck className="h-3.5 w-3.5" />{t("ui.fayda.id.verified")}
              </span>
              }
              {guarantorVerified &&
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                  <ShieldCheck className="h-3.5 w-3.5" />{t("ui.guarantor.verified")}
              </span>
              }
              {!faydaVerified && !guarantorVerified &&
              <span className="text-xs text-muted-foreground">{t("ui.verification.in.progress")}</span>
              }
            </div>

            {/* Standard view — employers and unrelated brokers */}
            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <Detail label="Experience" value={worker?.experience || record?.experience || "Not provided"} />
              <Detail label="Languages spoken" value={(worker?.languages ?? ["Amharic"]).join(", ")} />
              <Detail label="Age" value={worker?.age ?? record?.age ? `${worker?.age ?? record?.age}` : "Not disclosed"} />
              <Detail label="Gender" value={worker?.gender ?? record?.gender ?? "Not disclosed"} />
              <Detail label="Location" value={[area, city].filter(Boolean).join(", ") || "Not provided"} />
              <Detail label="Availability" value={available ? "Available" : "Not available"} />
              <Detail label="Service sector" value={roleLabel} />
              <Detail
                label="Expected baseline rate"
                value={worker?.rate || record?.price ? money(Number(worker?.rate || record?.price)) + " / month" : "Negotiable"} />
              
            </div>

            {/* Educational background — visible to every viewer */}
            {hasEducation &&
            <div className="border-t border-border p-6">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("ui.educational.background")}

              </h2>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <Detail label="Education level" value={education ?? "—"} />
                  <Detail label="Institution" value={educationInstitution ?? "—"} />
                  <Detail label="Qualification" value={educationQualification ?? "—"} />
                  <Detail
                  label="Graduation year"
                  value={educationGraduationYear ? String(educationGraduationYear) : "—"} />
                
                </div>
              </div>
            }

            {/* Full registration record — admin, registering broker, or self */}
            {access.full && record &&
            <div className="border-t border-border p-6">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("ui.full.registration.details")}

              </h2>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <Detail label="Phone" value={record.phone ?? "—"} />
                  <Detail label="E-mail" value={record.email ?? "—"} />
                  <Detail label="Fayda number" value={record.fayda_number ?? "—"} />
                  <Detail label="Sub city" value={record.sub_city ?? "—"} />
                  <Detail label="Wereda" value={record.wereda ?? "—"} />
                  <Detail label="Kebele" value={record.kebele ?? "—"} />
                  <Detail label="Address" value={record.address ?? "—"} />
                  <Detail label="Guarantor name" value={record.guarantor_name ?? "—"} />
                  <Detail label="Guarantor phone" value={record.guarantor_phone ?? "—"} />
                  <Detail label="Guarantor ID number" value={record.guarantor_id_number ?? "—"} />
                  <Detail label="Verification status" value={record.verification_status} />
                  <Detail label="Registered by" value={record.registered_by_name ?? record.registered_by ?? "—"} />
                </div>
              </div>
            }

            {!access.full &&
            <p className="border-t border-border px-6 py-4 text-xs text-muted-foreground">{t("ui.for.everyone.s.safety.contact.details.identity.documen")}


            </p>
            }

            {/* Registration documents — visible to admin, the employee and the registering broker */}
            {access.full && record &&
            <div className="border-t border-border p-6">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("ui.registration.documents")}

              </h2>
                <div className="mt-4">
                  <ProfileDocuments target="workers" record={record as unknown as Record<string, unknown>} />
                </div>

                {changeRequests.length > 0 &&
              <div className="mt-6 space-y-3">
                    <h3 className="text-sm font-semibold">{t("ui.update.requests")}</h3>
                    {changeRequests.map((r) =>
                <div key={r.id} className="rounded-xl border border-border p-4 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold capitalize">{r.status}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleString()}
                          </span>
                        </div>
                        <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                          {Object.entries((r.changes ?? {}) as Record<string, unknown>).map(([k, v]) =>
                    <li key={k}>
                              {fieldLabel("workers", k)}: <span className="text-foreground">{String(v ?? "—")}</span>
                            </li>
                    )}
                        </ul>
                        {r.admin_note && <p className="mt-2 text-xs">{t("ui.reviewer.note")}{r.admin_note}</p>}
                      </div>
                )}
                  </div>
              }
              </div>
            }

            {/* Employee self-service: read-only profile, availability switch only */}
            {access.isSelf && record &&
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-6">
                <div>
                  <p className="text-sm font-semibold">{t("ui.my.availability")}</p>
                  <p className="text-xs text-muted-foreground">{t("ui.your.registration.details.are.read.only.contact.suppor")}

                </p>
                </div>
                <button
                type="button"
                onClick={toggleAvailability}
                disabled={savingAvailability}
                aria-pressed={available}
                className="flex items-center gap-3 rounded-full border border-border px-4 py-2 text-sm font-semibold disabled:opacity-60">
                
                  {available ? "Available" : "Not available"}
                  <span
                  aria-hidden
                  className="relative h-6 w-11 rounded-full transition"
                  style={{ background: available ? "var(--brand)" : "var(--border)" }}>
                  
                    <span
                    className="absolute top-0.5 h-5 w-5 rounded-full bg-card transition-all"
                    style={{ left: available ? "1.375rem" : "0.125rem" }} />
                  
                  </span>
                </button>
              </div>
            }
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => window.history.back()} className="btn-outline-brand flex-1">{t("ui.back")}</button>
            {canAdminEdit &&
            <button type="button" onClick={() => setEditing(true)} className="btn-outline-brand flex-1">{t("ui.edit.profile")}

            </button>
            }
            {access.canEdit && record &&
            <Link to="/broker/$workerId" params={{ workerId: record.id }} className="btn-outline-brand flex-1 text-center">{t("ui.edit.employee.info")}

            </Link>
            }
            {access.ownsRecord && !isAdmin && record && user &&
            <button type="button" onClick={() => setRequesting(true)} className="btn-outline-brand flex-1">{t("ui.request.document.update")}

            </button>
            }
            {access.ownsRecord && record &&
            <Link to="/broker/assign" search={{ employer: undefined, worker: record.id }} className="btn-outline-brand flex-1 text-center">{t("ui.assign.to.employer")}

            </Link>
            }
            {!access.isSelf && !access.ownsRecord &&
            <button
              onClick={() => navigate({ to: "/request/$id", params: { id } })}
              className="btn-brand flex-1"
              disabled={!available}>{t("ui.request.this.employee")}


            </button>
            }
          </div>
        </div>
      </div>

      {editing && record &&
      <EditUserProfileModal
        worker={record}
        onClose={() => setEditing(false)}
        onSaved={(updated) => {
          setRecord(updated);
          setWorker((prev) =>
          prev ?
          {
            ...prev,
            name: updated.full_name,
            city: updated.city ?? prev.city,
            area: updated.area ?? prev.area,
            experience: updated.experience ?? prev.experience,
            available: Boolean(updated.available)
          } :
          prev
          );
        }} />

      }

      {requesting && record && user &&
      <RequestEditModal
        target="workers"
        record={record as unknown as Record<string, unknown>}
        requestedBy={user.id}
        requesterName={profile?.full_name ?? null}
        onClose={() => setRequesting(false)}
        onSubmitted={refreshRequests} />

      }
    </div>);

}

function Detail({ label, value }: {label: string;value: string;}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>);

}
