import { useLanguage } from "@/lib/i18n";import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { openSigned } from "@/lib/uploads";
import { timeAgo } from "@/lib/backoffice";
import {
  loadSubjectMessages,
  sendReviewMessage,
  type ReviewMessage } from
"@/lib/review-chat";

type Props = {
  /** The account under review — the other side of the conversation. */
  ownerId: string | null;
  /** Reviewed record identity. */
  source: string;
  subjectId: string;
  name: string;
  /** Signed-in user id. */
  viewerId: string | null;
  /** True when the viewer is a back-office reviewer. */
  asStaff: boolean;
  /** Preloaded messages (user-facing page passes its own thread). */
  messages?: ReviewMessage[];
  onSent?: () => void;
};

/**
 * Real-time, bidirectional document-feedback chat. Reviewers send corrective
 * notes; the user replies and can attach a corrected file in the same thread.
 */
export function FeedbackChat({
  ownerId,
  source,
  subjectId,
  name,
  viewerId,
  asStaff,
  messages: external,
  onSent
}: Props) {const { t } = useLanguage();
  const [messages, setMessages] = useState<ReviewMessage[]>(external ?? []);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const controlled = external !== undefined;

  const load = useCallback(async () => {
    if (controlled) return;
    setMessages(await loadSubjectMessages(source, subjectId));
  }, [controlled, source, subjectId]);

  useEffect(() => {
    if (controlled) setMessages(external ?? []);
  }, [controlled, external]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (controlled || !ownerId) return;
    const channel = supabase.
    channel(`review-${source}-${subjectId}`).
    on(
      "postgres_changes",
      { event: "*", schema: "public", table: "review_messages", filter: `subject_id=eq.${subjectId}` },
      () => load()
    ).
    subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [controlled, ownerId, source, subjectId, load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body && !file || !ownerId || !viewerId) return;
    setBusy(true);
    setError(null);
    try {
      await sendReviewMessage({
        source,
        subjectId,
        ownerId,
        senderId: viewerId,
        fromStaff: asStaff,
        body,
        file
      });
      setText("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await load();
      onSent?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the message");
    }
    setBusy(false);
  }

  if (!ownerId) {
    return <p className="text-sm text-muted-foreground">{t("ui.no.linked.account.to.chat.with.for.this.record")}</p>;
  }

  return (
    <div>
      <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
        {messages.map((m) => {
          const mine = m.sender_id === viewerId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                m.from_staff ? "bg-primary/10" : "bg-secondary/60"}`
                }>
                
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {m.from_staff ? "Reviewer" : name} · {timeAgo(m.created_at)}
                </p>
                {m.body && <p className="mt-1 whitespace-pre-wrap">{m.body}</p>}
                {m.attachment_path && m.attachment_bucket &&
                <button
                  onClick={() => openSigned(m.attachment_bucket!, m.attachment_path!)}
                  className="mt-2 text-xs font-semibold text-primary underline">
                  
                    📎 {m.attachment_name || "Open attachment"}
                  </button>
                }
              </div>
            </div>);

        })}
        {messages.length === 0 && <p className="text-sm text-muted-foreground">{t("ui.no.messages.yet")}</p>}
        <div ref={endRef} />
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <div className="mt-4 space-y-2">
        <textarea
          className="min-h-16 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          placeholder={asStaff ? `Tell ${name} what needs fixing…` : "Reply to the reviewer…"}
          value={text}
          onChange={(e) => setText(e.target.value)} />
        
        <div className="flex flex-wrap items-center gap-2">
          {!asStaff &&
          <input
            ref={fileRef}
            type="file"
            className="text-xs"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />

          }
          <button onClick={send} disabled={busy} className="btn-brand ml-auto text-xs disabled:opacity-60">
            {busy ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>);

}
