import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { openSigned } from "@/lib/uploads";
import { roleLabels, type VerificationStatus } from "@/lib/use-session";
import { sectorLabel } from "@/lib/app-config";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { AdminSection, adminInput } from "@/components/admin/shared";
import { AdminOriginTag } from "@/components/admin/AdminOriginTag";

export const Route = createFileRoute("/_authenticated/admin/verification")({
  component: AdminVerification,
});

type Source = "profiles" | "workers" | "broker_employers";

type Item = {
  id: string;
  source: Source;
  name: string;
  subtitle: string;
  status: VerificationStatus;
  note: string | null;
  docs: { label: string; bucket: string; path: string }[];
};

const FILTERS: { value: VerificationStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
  { value: "all", label: "All" },
];

function AdminVerification() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<VerificationStatus | "all">("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [profiles, apps, workers, employers] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("applications").select("*"),
      supabase.from("workers").select("*").order("created_at", { ascending: false }),
      supabase.from("broker_employers").select("*").order("created_at", { ascending: false }),
    ]);

    const appByUser = new Map((apps.data ?? []).map((a) => [a.user_id, a]));

    const next: Item[] = [];

    for (const p of profiles.data ?? []) {
      if (p.role === "admin" || p.role === "kyc") continue;
      const app = appByUser.get(p.id);
      next.push({
        id: p.id,
        source: "profiles",
        name: p.full_name || "Unnamed user",
        subtitle: `${roleLabels[p.role].en}${p.phone ? ` · ${p.phone}` : ""}${p.city ? ` · ${p.city}` : ""}`,
        status: p.verification_status,
        note: p.verification_note,
        docs: [
          app?.fayda_front && { label: "Fayda front", bucket: "id-documents", path: app.fayda_front },
          app?.fayda_back && { label: "Fayda back", bucket: "id-documents", path: app.fayda_back },
          app?.personal_photo && { label: "Photo", bucket: "avatars", path: app.personal_photo },
        ].filter(Boolean) as Item["docs"],
      });
    }

    for (const w of workers.data ?? []) {
      next.push({
        id: w.id,
        source: "workers",
        name: w.full_name,
        subtitle: `Worker · ${sectorLabel(w.sector)}${w.phone ? ` · ${w.phone}` : ""}`,
        status: w.verification_status,
        note: w.verification_note,
        docs: [
          w.fayda_front && { label: "Fayda front", bucket: "id-documents", path: w.fayda_front },
          w.fayda_back && { label: "Fayda back", bucket: "id-documents", path: w.fayda_back },
          w.contract_path && { label: "Contract", bucket: "id-documents", path: w.contract_path },
          w.photo_url && { label: "Photo", bucket: "avatars", path: w.photo_url },
        ].filter(Boolean) as Item["docs"],
      });
    }

    for (const e of employers.data ?? []) {
      next.push({
        id: e.id,
        source: "broker_employers",
        name: e.full_name,
        subtitle: `Employer via broker${e.phone ? ` · ${e.phone}` : ""}${e.city ? ` · ${e.city}` : ""}`,
        status: e.verification_status,
        note: e.verification_note,
        docs: [
          e.fayda_front && { label: "Fayda front", bucket: "id-documents", path: e.fayda_front },
          e.fayda_back && { label: "Fayda back", bucket: "id-documents", path: e.fayda_back },
          e.personal_photo && { label: "Photo", bucket: "avatars", path: e.personal_photo },
        ].filter(Boolean) as Item["docs"],
      });
    }

    setItems(next);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(item: Item, status: VerificationStatus) {
    setBusy(item.id);
    setError(null);
    const patch = {
      verification_status: status,
      verified_at: status === "approved" ? new Date().toISOString() : null,
      verification_note: notes[item.id]?.trim() || null,
    };
    // Approving a worker's documents lists them in "Available Employees" at once.
    const workerPatch = status === "approved" ? { ...patch, available: true } : patch;
    const { error: err } =
      item.source === "profiles"
        ? await supabase.from("profiles").update(patch).eq("id", item.id)
        : item.source === "workers"
          ? await supabase.from("workers").update(workerPatch).eq("id", item.id)
          : await supabase.from("broker_employers").update(patch).eq("id", item.id);
    setBusy(null);
    if (err) return setError(err.message);
    setItems((all) => all.map((x) => (x.id === item.id && x.source === item.source ? { ...x, ...patch } : x)));
  }

  const shown = items.filter((i) => filter === "all" || i.status === filter);

  return (
    <AdminSection
      title="Document verification"
      description="Approve or decline uploaded identity documents. Employees only appear on the public directory once approved, and brokers can only register people after they are verified."
    >
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              filter === f.value ? "border-primary bg-secondary" : "border-border text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-5 space-y-3">
        {shown.map((item) => (
          <div key={`${item.source}-${item.id}`} className="card-soft p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {item.name} <VerifiedBadge status={item.status} />
                  {item.source !== "broker_employers" && <AdminOriginTag table={item.source} id={item.id} />}
                </p>
                <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                {item.note && <p className="mt-1 text-sm text-muted-foreground">Note: {item.note}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {item.docs.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No documents uploaded</span>
                ) : (
                  item.docs.map((d) => (
                    <button key={d.label} onClick={() => openSigned(d.bucket, d.path)} className="btn-outline-brand text-xs">
                      {d.label}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                className={`${adminInput} max-w-sm`}
                placeholder="Reason or note (shown to the user)"
                value={notes[item.id] ?? ""}
                onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
              />
              <button disabled={busy === item.id} onClick={() => decide(item, "approved")} className="btn-brand text-xs disabled:opacity-60">
                Approve
              </button>
              <button disabled={busy === item.id} onClick={() => decide(item, "declined")} className="btn-outline-brand text-xs disabled:opacity-60">
                Decline
              </button>
            </div>
          </div>
        ))}
        {shown.length === 0 && <p className="text-muted-foreground">Nothing here right now.</p>}
      </div>
    </AdminSection>
  );
}
