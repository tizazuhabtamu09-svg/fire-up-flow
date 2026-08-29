import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminSection, adminInput } from "@/components/admin/shared";
import { useLanguage } from "@/lib/i18n";
import type { Database } from "@/integrations/supabase/types";

type Booking = Database["public"]["Tables"]["bookings"]["Row"];

export const Route = createFileRoute("/_authenticated/admin/bookings")({
  component: AdminBookings,
});

function AdminBookings() {
  const [rows, setRows] = useState<Booking[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    supabase.from("bookings").select("*").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  }, []);

  async function patch(b: Booking, p: Partial<Booking>) {
    const { error } = await supabase.from("bookings").update(p).eq("id", b.id);
    if (!error) setRows((r) => r.map((x) => (x.id === b.id ? { ...x, ...p } : x)));
  }

  return (
    <AdminSection title={t("admin.bookings.title")} description={t("admin.bookings.description")}>
      <div className="space-y-3">
        {rows.map((b) => (
          <div key={b.id} className="card-soft p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{b.service}</p>
                <p className="text-sm text-muted-foreground">
                  {b.worker_name ? `${b.worker_name} · ` : ""}{b.scheduled_date ?? t("admin.bookings.dateToConfirm")}
                  {b.address ? ` · ${b.address}` : ""}
                </p>
                {b.notes && <p className="mt-1 text-sm text-muted-foreground">“{b.notes}”</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold capitalize">{b.status}</span>
                <button onClick={() => patch(b, { status: "accepted" })} className="btn-brand text-xs">{t("admin.bookings.accept")}</button>
                <button onClick={() => patch(b, { status: "declined" })} className="btn-outline-brand text-xs">{t("admin.bookings.decline")}</button>
                <button onClick={() => patch(b, { status: "completed" })} className="btn-outline-brand text-xs">{t("admin.bookings.complete")}</button>
              </div>
            </div>
            <input
              className={`${adminInput} mt-3`}
              defaultValue={b.admin_note ?? ""}
              placeholder={t("admin.bookings.notePlaceholder")}
              onBlur={(e) => patch(b, { admin_note: e.target.value || null })}
            />
          </div>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground">{t("admin.bookings.empty")}</p>}
      </div>
    </AdminSection>
  );
}
