import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/app-config";
import { employmentLabel, JOB_STATUS_LABEL, type JobPost } from "@/lib/jobs";

const FILTERS = [
  { value: "pending_approval", label: "Pending approval" },
  { value: "published", label: "Live" },
  { value: "awaiting_payment", label: "Awaiting payment" },
  { value: "rejected", label: "Rejected" },
  { value: "closed", label: "Closed" },
];

type PaymentSlip = { payer_name: string | null; amount: number; receipt_path: string | null };

/** Staff queue: approve, reject or close employer job posts. */
export function JobApprovals({ reviewerId }: { reviewerId: string }) {
  const [filter, setFilter] = useState("pending_approval");
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [slips, setSlips] = useState<Record<string, PaymentSlip>>({});
  const [slipUrls, setSlipUrls] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("job_posts")
      .select("*")
      .eq("status", filter)
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    const list = data ?? [];
    setJobs(list);

    // Load the payment (and its receipt slip) attached to each job post.
    const paymentIds = list.map((j) => j.payment_id).filter(Boolean) as string[];
    if (paymentIds.length > 0) {
      const { data: pays } = await supabase
        .from("payments")
        .select("id, payer_name, amount, receipt_path")
        .in("id", paymentIds);
      const byId: Record<string, PaymentSlip> = {};
      const urls: Record<string, string> = {};
      for (const p of pays ?? []) {
        byId[p.id] = { payer_name: p.payer_name, amount: p.amount, receipt_path: p.receipt_path };
        if (p.receipt_path && !/\.pdf$/i.test(p.receipt_path)) {
          const { data: signed } = await supabase.storage.from("receipts").createSignedUrl(p.receipt_path, 300);
          if (signed?.signedUrl) urls[p.id] = signed.signedUrl;
        }
      }
      setSlips(byId);
      setSlipUrls(urls);
    } else {
      setSlips({});
      setSlipUrls({});
    }
    setLoading(false);
  }, [filter]);

  async function viewReceipt(path: string) {
    const { data } = await supabase.storage.from("receipts").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  useEffect(() => {
    load();
  }, [load]);

  async function review(job: JobPost, next: "published" | "rejected" | "closed") {
    const now = new Date().toISOString();
    const patch = {
      status: next,
      admin_note: notes[job.id]?.trim() || null,
      reviewed_by: reviewerId,
      reviewed_at: now,
      ...(next === "published" ? { published_at: now } : {}),
      ...(next === "closed" ? { closed_at: now } : {}),
    };
    const { error: err } = await supabase.from("job_posts").update(patch).eq("id", job.id);
    if (err) return setError(err.message);
    setJobs((list) => list.filter((j) => j.id !== job.id));
    setStatus(`${job.title} — ${JOB_STATUS_LABEL[next]}.`);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
              filter === f.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      {status && <p className="mt-4 text-sm text-primary">{status}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : jobs.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Nothing in this queue.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {jobs.map((job) => {
            const slip = job.payment_id ? slips[job.payment_id] : undefined;
            const slipUrl = job.payment_id ? slipUrls[job.payment_id] : undefined;
            return (
            <div key={job.id} className="card-soft p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{job.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {job.employer_name || "Employer"} · {employmentLabel(job.employment_type)} ·{" "}
                    {[job.city, job.area].filter(Boolean).join(" · ") || "Ethiopia"} · fee{" "}
                    {money(Number(job.fee_amount))}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase text-muted-foreground">
                  {JOB_STATUS_LABEL[job.status] ?? job.status}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{job.description}</p>
              {job.requirements && (
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Requirements: </span>
                  {job.requirements}
                </p>
              )}
              {job.contact_phone && <p className="mt-2 text-sm">Contact: {job.contact_phone}</p>}

              {job.payment_id && slips[job.payment_id] && (
                <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment slip</p>
                  <p className="mt-1 text-sm">
                    {slips[job.payment_id].payer_name || "Payer"} · {money(Number(slips[job.payment_id].amount))}
                  </p>
                  {slipUrls[job.payment_id] ? (
                    <a href={slipUrls[job.payment_id]} target="_blank" rel="noreferrer" className="mt-2 block">
                      <img
                        src={slipUrls[job.payment_id]}
                        alt={`Payment receipt for ${job.title}`}
                        className="max-h-64 rounded-lg border border-border object-contain"
                        loading="lazy"
                      />
                    </a>
                  ) : slips[job.payment_id].receipt_path ? (
                    <button
                      onClick={() => viewReceipt(slips[job.payment_id].receipt_path!)}
                      className="btn-outline-brand mt-2 text-xs"
                    >
                      View receipt (PDF)
                    </button>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">No receipt attached to this payment.</p>
                  )}
                </div>
              )}


              <div className="mt-4 flex flex-wrap items-center gap-2">
                <input
                  value={notes[job.id] ?? ""}
                  onChange={(e) => setNotes({ ...notes, [job.id]: e.target.value })}
                  placeholder="Note to the employer (optional)"
                  className="min-w-[220px] flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
                {job.status !== "published" && (
                  <button onClick={() => review(job, "published")} className="btn-brand text-xs">Approve &amp; publish</button>
                )}
                {job.status !== "rejected" && (
                  <button onClick={() => review(job, "rejected")} className="btn-outline-brand text-xs">Reject</button>
                )}
                {job.status !== "closed" && (
                  <button onClick={() => review(job, "closed")} className="text-xs font-semibold text-destructive hover:underline">
                    Close job
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
