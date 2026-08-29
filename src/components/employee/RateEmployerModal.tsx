import { useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Modal } from "@/components/employer/RateWorkerModal";
import type { EmployerMapping } from "@/lib/employee-employer";


const input = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

/** Employee rates their assigned employer (1–5 stars + optional review). */
export function RateEmployerModal({
  mapping,
  workerId,
  employeeId,
  onClose,
}: {
  mapping: EmployerMapping;
  workerId: string;
  employeeId: string;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from("employer_ratings").insert({
      employee_id: employeeId,
      worker_id: workerId,
      employer_id: mapping.employerId,
      broker_employer_id: mapping.brokerEmployerId,
      employer_name: mapping.employerName,
      rating,
      review: review.trim().slice(0, 1000) || null,
    });
    setSaving(false);
    if (err) setError(err.message);
    else setDone(true);
  }

  return (
    <Modal title={`Rate ${mapping.employerName}`} onClose={onClose}>
      {done ? (
        <div className="text-center">
          <p className="text-sm">Thank you — your rating was recorded.</p>
          <button onClick={onClose} className="btn-brand mt-4 text-sm">Close</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <span className="mb-1 block text-sm font-semibold">Your rating</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => setRating(n)}
                  className="p-1"
                >
                  <Star
                    className={`h-8 w-8 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">{rating} / 5</span>
            </div>
          </div>

          <label className="block text-sm font-semibold">
            Review (optional)
            <textarea
              className={`${input} mt-1 min-h-24`}
              maxLength={1000}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="How is it working with this employer?"
            />
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
