import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminSection, adminInput } from "@/components/admin/shared";
import { useLanguage } from "@/lib/i18n";
import type { Database } from "@/integrations/supabase/types";

type Message = Database["public"]["Tables"]["messages"]["Row"];

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: AdminMessages,
});

function AdminMessages() {
  const [rows, setRows] = useState<Message[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    supabase.from("messages").select("*").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  }, []);

  async function patch(m: Message, p: Partial<Message>) {
    const { error } = await supabase.from("messages").update(p).eq("id", m.id);
    if (!error) setRows((r) => r.map((x) => (x.id === m.id ? { ...x, ...p } : x)));
  }

  return (
    <AdminSection title={t("admin.messages.title")} description={t("admin.messages.description")}>
      <div className="space-y-3">
        {rows.map((m) => (
          <div key={m.id} className="card-soft p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold">{m.subject || t("admin.messages.defaultSubject")}</p>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold capitalize">{m.status}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{m.body}</p>
            <input
              className={`${adminInput} mt-3`}
              defaultValue={m.admin_reply ?? ""}
              placeholder={t("admin.messages.replyPlaceholder")}
              onBlur={(e) => patch(m, { admin_reply: e.target.value || null, status: e.target.value ? "answered" : m.status })}
            />
          </div>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground">{t("admin.messages.empty")}</p>}
      </div>
    </AdminSection>
  );
}
