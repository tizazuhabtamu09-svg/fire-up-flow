import { useLanguage } from "@/lib/i18n";import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useProfile } from "@/lib/use-session";
import { BrokerLock } from "@/components/BrokerLock";
import { uploadFile } from "@/lib/uploads";
import { BrokerNav } from "@/components/BrokerNav";
import { RegistrationForm, type RegistrationValues, type RegistrationFiles } from "@/components/RegistrationForm";
import { createRegisteredAccount } from "@/lib/account-creation.functions";
import { CredentialsModal } from "@/components/admin/CreateStaffForms";
import { ProfileDocuments } from "@/components/ProfileDocuments";
import { RequestEditModal } from "@/components/RequestEditModal";
import { loadChangeRequestsFor, fieldLabel, type ChangeRequest } from "@/lib/change-requests";
import type { Database } from "@/integrations/supabase/types";

type Employer = Database["public"]["Tables"]["broker_employers"]["Row"];

export const Route = createFileRoute("/_authenticated/broker/employers")({
  head: () => ({
    meta: [
    { title: "My employers — Agaze/አጋዝ" },
    { name: "description", content: "Register and manage the employers you work with on Agaze." },
    { name: "robots", content: "noindex" }]

  }),
  component: BrokerEmployersPage
});

function BrokerEmployersPage() {const { t } = useLanguage();
  const { user } = useSession();
  const { profile } = useProfile(user?.id);
  const verified = profile?.verification_status === "approved";
  const [rows, setRows] = useState<Employer[]>([]);
  const [open, setOpen] = useState(false);
  const create = useServerFn(createRegisteredAccount);
  const [credentials, setCredentials] = useState<{email: string;password: string;kind: string;} | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [requesting, setRequesting] = useState<Employer | null>(null);
  const [requests, setRequests] = useState<Record<string, ChangeRequest[]>>({});

  const loadRequests = useCallback((id: string) => {
    loadChangeRequestsFor(id).then((list) => setRequests((s) => ({ ...s, [id]: list })));
  }, []);

  const load = useCallback(() => {
    if (!user) return;
    supabase.
    from("broker_employers").
    select("*").
    eq("broker_id", user.id).
    order("created_at", { ascending: false }).
    then(({ data }) => setRows(data ?? []));
  }, [user]);
  useEffect(load, [load]);

  async function submit(v: RegistrationValues, files: RegistrationFiles): Promise<string | null> {
    if (!user) return "You must be signed in.";
    if (!v.email.trim()) return "An email address is required — it becomes the sign-in username for the employer.";
    try {
      const [f, b, p] = await Promise.all([
      files.idFront ? uploadFile("id-documents", user.id, "employer-front", files.idFront) : Promise.resolve(null),
      files.idBack ? uploadFile("id-documents", user.id, "employer-back", files.idBack) : Promise.resolve(null),
      files.photo ? uploadFile("avatars", user.id, "employer-photo", files.photo) : Promise.resolve(null)]
      );
      // Identical to the "Create accounts" console: creates the employer's
      // sign-in account, their employer record and one-time credentials.
      const result = await create({
        data: {
          role: "employer",
          full_name: v.full_name,
          email: v.email,
          phone: v.phone,
          address: v.address,
          city: v.city,
          sub_city: v.sub_city,
          wereda: v.wereda,
          kebele: v.kebele,
          fayda_number: v.fayda_number,
          latitude: v.latitude,
          longitude: v.longitude,
          fayda_front: f,
          fayda_back: b,
          personal_photo: p
        }
      });
      if (!("email" in result) || !result.email || !result.password) {
        return "error" in result && result.error || "Could not create the account.";
      }
      setCredentials({ email: result.email, password: result.password, kind: "Employer" });
      setOpen(false);
      load();
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Something went wrong";
    }
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from("broker_employers").delete().eq("id", id);
    if (!err) setRows((r) => r.filter((x) => x.id !== id));
  }

  return (
    <div>
      <BrokerNav />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("ui.my.employers")}</h1>
          <p className="font-amharic text-muted-foreground">የእኔ ቀጣሪዎች</p>
        </div>
        {verified &&
        <button onClick={() => setOpen((o) => !o)} className="btn-brand text-sm">
            {open ? "Close form" : "Add employer"}
          </button>
        }
      </div>

      {profile && !verified && <BrokerLock status={profile.verification_status} />}

      {open && verified &&
      <div className="mt-6">
          <RegistrationForm
          variant="employer"
          submitLabel="Register employer"
          note="An email address is required — it becomes the employer's sign-in username, and a one-time password is shown once after saving."
          onSubmit={submit} />
        
        </div>
      }

      {credentials && <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />}

      <div className="mt-8 space-y-3">
        {rows.map((r) =>
        <div key={r.id} className="card-soft flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="font-semibold">{r.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {r.phone ?? "No phone"}
                {r.city ? ` · ${r.city}` : ""}
                {r.fayda_number ? ` · Fayda ID ${r.fayda_number}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
              onClick={() => {
                const next = expanded === r.id ? null : r.id;
                setExpanded(next);
                if (next) loadRequests(r.id);
              }}
              className="btn-outline-brand text-xs">
              
                {expanded === r.id ? "Hide documents" : "View documents"}
              </button>
              <button onClick={() => setRequesting(r)} className="btn-outline-brand text-xs">{t("ui.request.document.update")}

            </button>
              <Link to="/broker/assign" search={{ employer: r.id, worker: undefined }} className="btn-outline-brand text-xs">{t("ui.assign.worker")}</Link>
              <button onClick={() => remove(r.id)} className="text-xs font-semibold text-destructive hover:underline">{t("ui.delete")}</button>
            </div>

            {expanded === r.id &&
          <div className="w-full border-t border-border pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("ui.registration.documents")}

            </h3>
                <div className="mt-3">
                  <ProfileDocuments target="broker_employers" record={r as unknown as Record<string, unknown>} />
                </div>

                {(requests[r.id]?.length ?? 0) > 0 &&
            <div className="mt-5 space-y-3">
                    <h3 className="text-sm font-semibold">{t("ui.update.requests")}</h3>
                    {requests[r.id]!.map((q) =>
              <div key={q.id} className="rounded-xl border border-border p-4 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold capitalize">{q.status}</span>
                          <span className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleString()}</span>
                        </div>
                        <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                          {Object.entries((q.changes ?? {}) as Record<string, unknown>).map(([k, v]) =>
                  <li key={k}>
                              {fieldLabel("broker_employers", k)}: <span className="text-foreground">{String(v ?? "—")}</span>
                            </li>
                  )}
                        </ul>
                        {q.admin_note && <p className="mt-2 text-xs">{t("ui.reviewer.note")}{q.admin_note}</p>}
                      </div>
              )}
                  </div>
            }
              </div>
          }
          </div>
        )}
        {rows.length === 0 && <p className="text-muted-foreground">{t("ui.no.employers.registered.yet")}</p>}
      </div>

      {requesting && user &&
      <RequestEditModal
        target="broker_employers"
        record={requesting as unknown as Record<string, unknown>}
        requestedBy={user.id}
        requesterName={profile?.full_name ?? null}
        onClose={() => setRequesting(null)}
        onSubmitted={() => loadRequests(requesting.id)} />

      }
    </div>);

}
