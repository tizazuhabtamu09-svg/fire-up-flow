import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { HiredEmployee } from "@/lib/requests";

const input = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

/** Performance feedback modal for a worker on the employer's active roster. */
export function RateWorkerModal({ hire, onClose }: { hire: HiredEmployee; onClose: () => void }) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { error: err } = await supabase.from("worker_ratings").insert({
      employer_id: uid,
      hired_id: hire.id,
      worker_ref: hire.worker_ref,
      worker_name: hire.worker_name,
      rating,
      review: review.trim().slice(0, 1000) || null,
    });
    setSaving(false);
    if (err) setError(err.message);
    else setDone(true);
  }

  return (
    <Modal title={`Rate ${hire.worker_name}`} onClose={onClose}>
      {done ? (
        <div className="text-center">
          <p className="text-sm">Thank you — your feedback was recorded.</p>
          <button onClick={onClose} className="btn-brand mt-4 text-sm">Close</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <span className="mb-1 block text-sm font-semibold">Performance rating</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setRating(n)}
                  className={`h-10 w-10 rounded-full text-sm font-bold ${n <= rating ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <label className="block text-sm font-semibold">
            Review (optional)
            <textarea className={`${input} mt-1 min-h-24`} maxLength={1000} value={review} onChange={(e) => setReview(e.target.value)} />
          </label>
          {error && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={saving} className="btn-brand w-full text-sm disabled:opacity-60">
            {saving ? "Saving…" : "Submit rating"}
          </button>
        </form>
      )}
    </Modal>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-background p-6 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full bg-secondary px-3 py-1 text-sm">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}
