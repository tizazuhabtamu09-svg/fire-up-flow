import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminInput } from "@/components/admin/shared";
import { requestTotal, statusMeta, type EmployeeRequest } from "@/lib/requests";

const STATUSES = [
  "PENDING_ADMIN_REVIEW",
  "PENDING_PAYMENT",
  "AWAITING_PAYMENT_VERIFICATION",
  "COMPLETED",
  "DECLINED",
] as const;

type PoolWorker = { id: string | null; name: string; sector: string; price: number | null };

/** Queue of employer → employee requests: review, assign a candidate, price it and send the proposal. */
export function EmployeeRequests() {
  const [rows, setRows] = useState<EmployeeRequest[]>([]);
  const [pool, setPool] = useState<PoolWorker[]>([]);
  const [filter, setFilter] = useState<string>("PENDING_ADMIN_REVIEW");

  useEffect(() => {
    supabase
      .from("employee_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as EmployeeRequest[]));

    supabase
      .from("workers")
      .select("id, full_name, sector, price, verification_status")
      .eq("verification_status", "approved")
      .then(({ data }) => {
        const registered: PoolWorker[] = (data ?? []).map((w) => ({
          id: w.id,
          name: w.full_name,
          sector: w.sector ?? "",
          price: w.price === null ? null : Number(w.price),
        }));
        setPool(registered);
      });
  }, []);

  async function patch(row: EmployeeRequest, p: Partial<EmployeeRequest>) {
    const { error } = await supabase.from("employee_requests").update(p).eq("id", row.id);
    if (!error) setRows((r) => r.map((x) => (x.id === row.id ? { ...x, ...p } : x)));
  }

  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === s ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            {s === "all" ? "All" : statusMeta(s).label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map((r) => (
          <RequestCard key={r.id} row={r} pool={pool} patch={patch} />
        ))}
        {visible.length === 0 && <p className="text-muted-foreground">No requests in this queue.</p>}
      </div>
    </div>
  );
}

function RequestCard({
  row,
  pool,
  patch,
}: {
  row: EmployeeRequest;
  pool: PoolWorker[];
  patch: (row: EmployeeRequest, p: Partial<EmployeeRequest>) => Promise<void>;
}) {
  const answers = (row.sector_answers ?? {}) as Record<string, string>;
  const meta = statusMeta(row.status);

  const [assigned, setAssigned] = useState(row.assigned_worker_name ?? row.employee_name);
  const [salary, setSalary] = useState(row.salary != null ? String(row.salary) : row.budget != null ? String(row.budget) : "");
  const [serviceFee, setServiceFee] = useState(row.service_fee != null ? String(row.service_fee) : "");
  const [allowances, setAllowances] = useState(row.allowances != null ? String(row.allowances) : "");
  const [note, setNote] = useState(row.allowances_note ?? "");
  const [response, setResponse] = useState(row.admin_response ?? "");
  const [sending, setSending] = useState(false);

  const total = Number(salary || 0) + Number(serviceFee || 0) + Number(allowances || 0);

  async function sendProposal() {
    setSending(true);
    const match = pool.find((p) => p.name === assigned);
    await patch(row, {
      assigned_worker_name: assigned || row.employee_name,
      assigned_worker_id: match?.id ?? null,
      salary: salary ? Number(salary) : null,
      service_fee: serviceFee ? Number(serviceFee) : null,
      allowances: allowances ? Number(allowances) : null,
      allowances_note: note || null,
      admin_response: response || null,
      status: "PENDING_PAYMENT",
    });
    setSending(false);
  }

  return (
    <div className="card-soft p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{row.employee_name} · {row.sector}</p>
          <p className="text-sm text-muted-foreground">
            {row.duration ?? "Duration to confirm"}
            {row.location ? ` · ${row.location}` : ""}
            {row.budget ? ` · budget ETB ${Number(row.budget).toLocaleString()}` : ""}
          </p>
          {row.contact_phone && <p className="text-sm text-muted-foreground">Extra contact: {row.contact_phone}</p>}
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.tone}`}>{meta.label}</span>
      </div>

      {Object.keys(answers).length > 0 && (
        <dl className="mt-3 grid gap-2 rounded-xl bg-secondary/50 p-3 text-sm sm:grid-cols-2">
          {Object.entries(answers).map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k.replaceAll("_", " ")}</dt>
              <dd>{String(v)}</dd>
            </div>
          ))}
        </dl>
      )}

      {row.message && <p className="mt-3 text-sm text-muted-foreground">“{row.message}”</p>}

      <div className="mt-4 rounded-xl border border-border p-4">
        <h3 className="text-sm font-bold">Assignment & fee proposal</h3>
        <label className="mt-3 block text-sm font-semibold">
          Assigned worker (requested worker or someone from the registered pool)
          <input
            className={`${adminInput} mt-1`}
            list={`pool-${row.id}`}
            value={assigned}
            onChange={(e) => setAssigned(e.target.value)}
            placeholder="Type a name…"
          />
        </label>
        <datalist id={`pool-${row.id}`}>
          {pool.map((p, i) => (
            <option key={`${p.name}-${i}`} value={p.name}>
              {p.sector}
              {p.price ? ` · ETB ${p.price}` : ""}
            </option>
          ))}
        </datalist>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-semibold">
            Base compensation / salary
            <input className={`${adminInput} mt-1`} type="number" min={0} value={salary} onChange={(e) => setSalary(e.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Platform / service fee
            <input className={`${adminInput} mt-1`} type="number" min={0} value={serviceFee} onChange={(e) => setServiceFee(e.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Additional allowances / charges
            <input className={`${adminInput} mt-1`} type="number" min={0} value={allowances} onChange={(e) => setAllowances(e.target.value)} />
          </label>
        </div>
        <input
          className={`${adminInput} mt-3`}
          value={note}
          placeholder="What the additional charges cover (optional)"
          onChange={(e) => setNote(e.target.value)}
        />
        <textarea
          className={`${adminInput} mt-3 min-h-20`}
          value={response}
          placeholder="Message to the employer with the proposal…"
          onChange={(e) => setResponse(e.target.value)}
        />
        <p className="mt-3 text-sm font-semibold">Total to invoice: ETB {total.toLocaleString()}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={sendProposal} disabled={sending || total <= 0} className="btn-brand text-xs disabled:opacity-60">
            {sending ? "Sending…" : "Send proposal to employer"}
          </button>
          {row.status === "AWAITING_PAYMENT_VERIFICATION" && (
            <button onClick={() => patch(row, { status: "COMPLETED", paid_at: new Date().toISOString() })} className="btn-outline-brand text-xs">
              Confirm payment received
            </button>
          )}
          <button onClick={() => patch(row, { status: "DECLINED" })} className="btn-outline-brand text-xs">Decline request</button>
        </div>
      </div>

      <input
        className={`${adminInput} mt-3`}
        defaultValue={row.admin_note ?? ""}
        placeholder="Internal note…"
        onBlur={(e) => patch(row, { admin_note: e.target.value || null })}
      />
      {row.assigned_worker_name && (
        <p className="mt-2 text-xs text-muted-foreground">
          Proposed: {row.assigned_worker_name} · invoice ETB {requestTotal(row).toLocaleString()}
        </p>
      )}
    </div>
  );
}
