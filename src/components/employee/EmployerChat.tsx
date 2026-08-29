import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { loadConversation, sendDirectMessage, type DirectMessage } from "@/lib/employee-employer";

/** Private chat thread between an employee and their directly assigned employer. */
export function EmployerChat({
  me,
  other,
  otherName,
}: {
  me: string;
  other: string;
  otherName: string;
}) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const rows = await loadConversation(me, other);
    setMessages(rows);
  }, [me, other]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    try {
      await sendDirectMessage(me, other, body);
      setBody("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl bg-secondary/50 p-4">
      <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Chat with {otherName}</p>
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">No messages yet — say hello.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_id === me ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                m.sender_id === me ? "bg-primary text-primary-foreground" : "bg-card"
              }`}
            >
              <p>{m.body}</p>
              <p className={`mt-0.5 text-[10px] ${m.sender_id === me ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {new Date(m.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          placeholder="Write a message…"
          className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button disabled={sending || !body.trim()} className="btn-brand inline-flex items-center gap-1.5 text-sm disabled:opacity-60">
          <Send className="h-4 w-4" /> Send
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
