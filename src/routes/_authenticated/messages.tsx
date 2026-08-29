import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { useLanguage } from "@/lib/i18n";
import type { Database } from "@/integrations/supabase/types";

type Message = Database["public"]["Tables"]["messages"]["Row"];

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Agaze/አጋዝ" },
      { name: "description", content: "Message the Agaze support team. All conversations are handled by our admin." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MessagesPage,
});

const cls = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:border-primary";

function MessagesPage() {
  const { t } = useLanguage();
  const { user } = useSession();
  const [items, setItems] = useState<Message[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });
    setItems(data ?? []);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`my-messages-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `sender_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  async function sendFollowUp(m: Message) {
    const text = (replies[m.id] ?? "").trim();
    if (!user || !text) return;
    const subj = m.subject?.startsWith("Re:") ? m.subject : `Re: ${m.subject || t("msg.documentReview")}`;
    const { error: err } = await supabase
      .from("messages")
      .insert({ sender_id: user.id, subject: subj, body: text });
    if (err) return setError(err.message);
    setReplies({ ...replies, [m.id]: "" });
    load();
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !body.trim()) return;
    setSaving(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("messages")
      .insert({ sender_id: user.id, subject: subject.trim() || null, body: body.trim() })
      .select()
      .single();
    setSaving(false);
    if (err) return setError(err.message);
    setItems((m) => [data, ...m]);
    setSubject("");
    setBody("");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">{t("msg.title")}</h1>
      <p className="font-amharic text-muted-foreground">መልእክቶች</p>
      <p className="mt-2 text-sm text-muted-foreground">{t("msg.privacyNote")}</p>

      <form onSubmit={send} className="card-soft mt-6 space-y-4 p-6">
        <label className="block">
          <span className="text-sm font-medium">{t("msg.subject")}</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className={cls} maxLength={120} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t("msg.message")}</span>
          <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} className={cls} required maxLength={2000} />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button disabled={saving} className="btn-brand w-full disabled:opacity-60">
          {saving ? t("msg.sending") : t("msg.sendToAdmin")}
        </button>
      </form>

      <div className="mt-8 space-y-3">
        {items.map((m) => (
          <div key={m.id} className="card-soft p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{m.subject || t("msg.messageFallback")}</p>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold capitalize">{m.status}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{m.body}</p>
            {m.admin_reply && (
              <div className="mt-3 rounded-xl bg-secondary/60 p-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("msg.adminReply")}</p>
                <p className="mt-1">{m.admin_reply}</p>
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <input
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder={t("msg.replyPlaceholder")}
                value={replies[m.id] ?? ""}
                onChange={(e) => setReplies({ ...replies, [m.id]: e.target.value })}
              />
              <button onClick={() => sendFollowUp(m)} className="btn-outline-brand text-xs">{t("msg.reply")}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
