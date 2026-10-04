import { useLanguage } from "@/lib/i18n";import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { BrokerNav } from "@/components/BrokerNav";
import { money, sectorLabel } from "@/lib/app-config";
import type { WorkerRow } from "@/components/WorkerForm";
import { resolveAvatars } from "@/lib/employees";
import { EmployeeAvatar } from "@/components/EmployeeAvatar";

export const Route = createFileRoute("/_authenticated/broker/")({
  head: () => ({
    meta: [
    { title: "My employees — Agaze/አጋዝ" },
    { name: "description", content: "Broker workspace: manage the employees registered under your Agaze account." },
    { name: "robots", content: "noindex" }]

  }),
  component: BrokerEmployeesPage
});

function BrokerEmployeesPage() {const { t } = useLanguage();
  const { user } = useSession();
  const [rows, setRows] = useState<WorkerRow[]>([]);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.
    from("workers").
    select("*").
    eq("owner_id", user.id).
    order("created_at", { ascending: false }).
    then(async ({ data }) => {
      const list = data ?? [];
      setRows(list);
      setLoading(false);
      setPhotos(await resolveAvatars(list.map((w) => w.photo_url)));
    });
  }, [user]);

  async function toggle(w: WorkerRow) {
    const next = !w.available;
    const { error } = await supabase.from("workers").update({ available: next }).eq("id", w.id);
    if (!error) setRows((r) => r.map((x) => x.id === w.id ? { ...x, available: next } : x));
  }

  async function remove(id: string) {
    const { error } = await supabase.from("workers").delete().eq("id", id);
    if (!error) setRows((r) => r.filter((x) => x.id !== id));
  }


  return (
    <div>
      <BrokerNav />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("ui.list.of.my.employees")}</h1>
          <p className="font-amharic text-muted-foreground">የእኔ ሰራተኞች ዝርዝር</p>
        </div>
        <Link to="/broker/new" className="btn-brand text-sm">{t("ui.add.employee")}</Link>
      </div>

      {loading ?
      <p className="mt-8 text-muted-foreground">{t("ui.loading")}</p> :
      rows.length === 0 ?
      <div className="card-soft mt-8 p-10 text-center">
          <p className="text-muted-foreground">{t("ui.you.haven.t.registered.any.employees.yet")}</p>
          <Link to="/broker/new" className="btn-brand mt-5 inline-block text-sm">{t("ui.add.your.first.employee")}</Link>
        </div> :

      <div className="mt-8 space-y-3">
          {rows.map((w) =>
        <div key={w.id} className="card-soft flex flex-wrap items-center justify-between gap-4 p-5">
              <Link
            to="/employee/$id"
            params={{ id: w.id }}
            className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80">
            
                <EmployeeAvatar photoUrl={photos[w.photo_url ?? ""] ?? null} name={w.full_name} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{w.full_name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {sectorLabel(w.sector, w.sector_other)}
                    {w.phone ? ` · ${w.phone}` : ""}
                    {w.area ? ` · ${w.area}` : ""}
                    {w.price ? ` · ${money(w.price)}/month` : ""}
                  </p>
                </div>
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => toggle(w)} className="btn-outline-brand text-xs">
                  {w.available ? "Available" : "Not available"}
                </button>
                <Link
              to="/broker/assign"
              search={{ employer: undefined, worker: w.id }}
              className="btn-brand text-xs">{t("ui.assign.to.employer")}


            </Link>
                <Link to="/employee/$id" params={{ id: w.id }} className="btn-outline-brand text-xs">{t("ui.edit.info")}</Link>
                <button onClick={() => remove(w.id)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-destructive hover:underline">{t("ui.delete")}

            </button>
              </div>
            </div>

        )}
        </div>
      }
    </div>);

}
