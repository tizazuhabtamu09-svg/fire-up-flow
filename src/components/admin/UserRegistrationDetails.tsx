import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sectorLabel, money } from "@/lib/app-config";
import { languageLabel } from "@/lib/languages";
import { skillLabel } from "@/lib/skills";
import { ProfileDocuments } from "@/components/ProfileDocuments";
import { EditUserProfileModal } from "@/components/admin/EditUserProfileModal";
import type { WorkerRecord } from "@/lib/employee-profile";

/**
 * Everything captured during registration for one account, shown to admins in
 * User management. Admins can open the full editor from here.
 */
export function UserRegistrationDetails({
  userId,
  phone,
}: {
  userId: string;
  phone?: string | null;
}) {
  const [worker, setWorker] = useState<WorkerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("workers").select("*").eq("user_id", userId).maybeSingle();
    let row = data ?? null;
    if (!row && phone) {
      const fallback = await supabase.from("workers").select("*").eq("phone", phone).limit(1);
      row = fallback.data?.[0] ?? null;
    }
    setWorker(row as WorkerRecord | null);
    setLoading(false);
  }, [userId, phone]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="mt-5 text-sm text-muted-foreground">Loading registration details…</p>;
  if (!worker)
    return (
      <p className="mt-5 text-sm text-muted-foreground">
        No employee registration record is linked to this account.
      </p>
    );

  const rows: Array<[string, string]> = [
    ["Full name", worker.full_name ?? "—"],
    ["Phone", worker.phone ?? "—"],
    ["E-mail", worker.email ?? "—"],
    ["Gender", worker.gender ?? "—"],
    ["Age", worker.age != null ? String(worker.age) : "—"],
    ["Sector", worker.sector ? sectorLabel(worker.sector) : "—"],
    ["Sector (other)", worker.sector_other ?? "—"],
    ["Experience", worker.experience ?? "—"],
    ["Expected rate", worker.price != null ? money(worker.price) : "—"],
    ["Language", languageLabel(worker.language, worker.language_other) || "—"],
    ["Skills", (worker.skills ?? []).map((s) => skillLabel(s)).join(", ") || "—"],
    ["City", worker.city ?? "—"],
    ["Sub city", worker.sub_city ?? "—"],
    ["Wereda", worker.wereda ?? "—"],
    ["Kebele", worker.kebele ?? "—"],
    ["Area", worker.area ?? "—"],
    ["Address", worker.address ?? "—"],
    ["Fayda number", worker.fayda_number ?? "—"],
    ["Fayda verified", worker.fayda_verified ? "Yes" : "No"],
    ["Guarantor name", worker.guarantor_name ?? "—"],
    ["Guarantor phone", worker.guarantor_phone ?? "—"],
    ["Guarantor ID number", worker.guarantor_id_number ?? "—"],
    ["Guarantor verified", worker.guarantor_verified ? "Yes" : "No"],
    ["Availability", worker.available ? "Available" : "Not available"],
    ["Roster status", worker.global_status ?? "—"],
    ["Verification", worker.verification_status],
    ["Registered via", worker.registration_type ?? "—"],
    ["Registered by", worker.registered_by_name ?? "—"],
    ["Registered on", new Date(worker.created_at).toLocaleDateString()],
  ];

  return (
    <div className="mt-5 rounded-xl bg-secondary/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Registration information
        </p>
        <button onClick={() => setEditing(true)} className="btn-outline-brand text-xs">
          Edit registration details
        </button>
      </div>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-card p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 break-words text-sm">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Registration documents
      </p>
      <div className="mt-2">
        <ProfileDocuments target="workers" record={worker as unknown as Record<string, unknown>} />
      </div>

      {editing && (
        <EditUserProfileModal
          worker={worker}
          onClose={() => setEditing(false)}
          onSaved={(updated) => setWorker(updated)}
        />
      )}
    </div>
  );
}
