import { useLanguage } from "@/lib/i18n";import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AdminSection, adminInput } from "@/components/admin/shared";
import { useSession } from "@/lib/use-session";
import { SECTORS } from "@/lib/app-config";
import { addSector, listAllSectors, setSectorActive, type CustomSector } from "@/lib/sectors";

export const Route = createFileRoute("/_authenticated/admin/sectors")({
  head: () => ({
    meta: [
    { title: "Sector management — Agaze/አጋዝ" },
    { name: "description", content: "Add new job sectors that appear in every sector dropdown across the platform." },
    { name: "robots", content: "noindex" }]

  }),
  component: AdminSectors
});

function AdminSectors() {const { t } = useLanguage();
  const { user } = useSession();
  const [rows, setRows] = useState<CustomSector[]>([]);
  const [label, setLabel] = useState("");
  const [am, setAm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await listAllSectors());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await addSector(label, am, user?.id ?? null);
      setLabel("");
      setAm("");
      setMessage("Sector added — it is now available in every sector dropdown.");
      await load();
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      setError(/duplicate key/i.test(raw) ? "That sector already exists." : raw);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(row: CustomSector) {
    setError(null);
    try {
      await setSectorActive(row.id, !row.active);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <AdminSection
      title={t("ui.sector.management")}
      description="Add a new sector once and it appears immediately in the sector dropdown on every registration, worker and filter form.">
      
      <form onSubmit={submit} className="card-soft grid gap-3 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block text-sm font-semibold">{t("ui.sector.name.english")}

          <input
            required
            maxLength={80}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("ui.e.g.gardener")}
            className={`${adminInput} mt-1 font-normal`} />
          
        </label>
        <label className="block text-sm font-semibold">{t("ui.amharic.name.optional")}

          <input
            maxLength={80}
            value={am}
            onChange={(e) => setAm(e.target.value)}
            placeholder="አማርኛ"
            className={`${adminInput} mt-1 font-normal`} />
          
        </label>
        <button disabled={busy} className="btn-brand text-sm disabled:opacity-60">
          {busy ? "Adding…" : "Add sector"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}

      <h3 className="mt-8 text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("ui.added.sectors")}</h3>
      <div className="mt-3 space-y-2">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">{t("ui.no.custom.sectors.yet")}</p>}
        {rows.map((r) =>
        <div key={r.id} className="card-soft flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{r.label}</p>
              <p className="font-amharic text-xs text-muted-foreground">{r.am || r.key}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
              r.active ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`
              }>
              
                {r.active ? "Visible" : "Hidden"}
              </span>
              <button onClick={() => toggle(r)} className="btn-outline-brand text-xs">
                {r.active ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        )}
      </div>

      <h3 className="mt-8 text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("ui.built.in.sectors")}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {SECTORS.map((s) =>
        <span key={s.value} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
            {s.label}
          </span>
        )}
      </div>
    </AdminSection>);

}
