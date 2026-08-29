import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { openSigned } from "@/lib/uploads";
import { BrokerNav } from "@/components/BrokerNav";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["assignments"]["Row"] & {
  broker_employers: { full_name: string; phone: string | null } | null;
  workers: { full_name: string; sector: string } | null;
};

export const Route = createFileRoute("/_authenticated/broker/assignments")({
  head: () => ({
    meta: [
      { title: "Assignment history — Agaze/አጋዝ" },
      { name: "description", content: "Read-only history of the workers you assigned to employers on Agaze." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const { user } = useSession();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("assignments")
      .select("*, broker_employers(full_name, phone), workers(full_name, sector)")
      .eq("broker_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows((data ?? []) as unknown as Row[]);
        setLoading(false);
      });
  }, [user]);

  return (
    <div>
      <BrokerNav />
      <h1 className="text-3xl font-bold">Assignment history</h1>
      <p className="font-amharic text-muted-foreground">የምደባ ታሪክ</p>
      <p className="mt-2 text-sm text-muted-foreground">Read-only. Contact an admin to change an assignment.</p>

      {loading ? (
        <p className="mt-8 text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No assignments yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="card-soft p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {r.workers?.full_name ?? "Worker"} → {r.broker_employers?.full_name ?? "Employer"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Witness {r.witness_name} · {r.witness_phone}
                    {r.witness_sex ? ` · ${r.witness_sex}` : ""} · {new Date(r.created_at).toLocaleDateString()}
                  </p>
                  {r.admin_note && <p className="mt-1 text-sm text-muted-foreground">Admin note: {r.admin_note}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold capitalize">{r.status}</span>
                  {r.agreement_path && (
                    <button onClick={() => openSigned("id-documents", r.agreement_path!)} className="btn-outline-brand text-xs">
                      View agreement
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
