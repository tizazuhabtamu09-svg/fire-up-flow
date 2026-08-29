import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { requestTotal, statusMeta, type EmployeeRequest } from "@/lib/requests";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/my-requests")({
  head: () => ({
    meta: [
      { title: "My requests — Agaze/አጋዝ" },
      { name: "description", content: "Track your candidate requests, review the fee proposal and pay to activate the placement." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyRequests,
});

function MyRequests() {
  const { t } = useLanguage();
  const { user } = useSession();
  const [rows, setRows] = useState<EmployeeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("employee_requests")
      .select("*")
      .eq("employer_id", user.id)
      .order("created_at", { ascending: false });
    setRows((data ?? []) as EmployeeRequest[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Once a request is paid & completed, make sure the worker sits in "My team".
  useEffect(() => {
    if (!user) return;
    const done = rows.filter((r) => r.status === "COMPLETED");
    if (done.length === 0) return;
    (async () => {
      const { data: existing } = await supabase
        .from("hired_employees")
        .select("request_id")
        .eq("employer_id", user.id);
      const have = new Set((existing ?? []).map((e) => e.request_id));
      const missing = done.filter((r) => !have.has(r.id));
      if (missing.length === 0) return;
      await supabase.from("hired_employees").insert(
        missing.map((r) => ({
          employer_id: user.id,
          request_id: r.id,
          worker_ref: r.assigned_worker_id ?? r.employee_ref,
          worker_name: r.assigned_worker_name ?? r.employee_name,
          sector: r.sector,
          salary: r.salary,
        })),
      );
    })();
  }, [rows, user]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("reqs.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("reqs.subtitle")}</p>
        </div>
        <Link to="/workers" className="btn-outline-brand text-sm">{t("reqs.browseWorkers")}</Link>
      </div>

      {loading ? (
        <p className="mt-8 text-muted-foreground">{t("common.loading")}</p>
      ) : rows.length === 0 ? (
        <div className="card-soft mt-8 p-10 text-center">
          <p className="text-muted-foreground">{t("reqs.empty")}</p>
          <Link to="/workers" className="btn-brand mt-5 inline-block text-sm">{t("reqs.findSomeone")}</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {rows.map((r) => (
            <RequestCard key={r.id} row={r} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({ row, onChanged }: { row: EmployeeRequest; onChanged: () => void }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const meta = statusMeta(row.status);
  const total = requestTotal(row);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function payFromWallet() {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.rpc("spend_wallet", {
      _amount: total,
      _reason: `Placement payment — ${row.assigned_worker_name ?? row.employee_name}`,
    });
    if (err) {
      setError(err.message.includes("balance") ? t("reqs.insufficientBalance") : err.message);
      setBusy(false);
      return;
    }
    await supabase
      .from("employee_requests")
      .update({ status: "AWAITING_PAYMENT_VERIFICATION" })
      .eq("id", row.id);
    setBusy(false);
    onChanged();
  }


  async function payExternally() {
    setBusy(true);
    await supabase.from("employee_requests").update({ status: "AWAITING_PAYMENT_VERIFICATION" }).eq("id", row.id);
    setBusy(false);
    navigate({
      to: "/payment",
      search: { purpose: `placement:${row.assigned_worker_name ?? row.employee_name}`, amount: total },
    });
  }

  return (
    <div className="card-soft p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{row.assigned_worker_name ?? row.employee_name} · {row.sector}</p>
          <p className="text-sm text-muted-foreground">
            {row.duration ?? t("reqs.durationToConfirm")}
            {row.location ? ` · ${row.location}` : ""}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.tone}`}>{meta.label}</span>
      </div>

      {row.admin_response && <p className="mt-3 rounded-xl bg-secondary/60 p-3 text-sm">{row.admin_response}</p>}

      {row.status === "PENDING_ADMIN_REVIEW" && (
        <p className="mt-3 text-sm text-muted-foreground">{t("reqs.noPaymentYet")}</p>
      )}

      {total > 0 && (
        <>
          <button onClick={() => setOpen((o) => !o)} className="mt-3 text-sm font-semibold text-primary">
            {open ? t("reqs.hideInvoice") : t("reqs.viewInvoice")}
          </button>
          {open && (
            <dl className="mt-3 space-y-1 rounded-xl bg-secondary/50 p-4 text-sm">
              <Line label={t("reqs.baseCompensation")} value={row.salary} />
              <Line label={t("reqs.platformFee")} value={row.service_fee} />
              <Line label={row.allowances_note || t("reqs.additionalAllowances")} value={row.allowances} />
              <div className="flex justify-between border-t border-border pt-2 font-bold">
                <dt>{t("reqs.total")}</dt>
                <dd>ETB {total.toLocaleString()}</dd>
              </div>
            </dl>
          )}
        </>
      )}

      {error && <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      {row.status === "PENDING_PAYMENT" && total > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={payFromWallet} disabled={busy} className="btn-brand text-sm disabled:opacity-60">
            {busy ? t("reqs.processing") : t("reqs.proceedToPay", { amount: total.toLocaleString() })}
          </button>
          <button onClick={payExternally} disabled={busy} className="btn-outline-brand text-sm disabled:opacity-60">
            {t("reqs.payByBank")}
          </button>
        </div>
      )}

      {row.status === "AWAITING_PAYMENT_VERIFICATION" && (
        <p className="mt-3 text-sm text-muted-foreground">{t("reqs.verifyingPayment")}</p>
      )}

      {row.status === "COMPLETED" && (
        <Link to="/my-team" className="btn-outline-brand mt-4 inline-block text-sm">{t("reqs.viewInMyTeam")}</Link>
      )}
    </div>
  );
}

function Line({ label, value }: { label: string; value: number | null }) {
  if (value == null || Number(value) === 0) return null;
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>ETB {Number(value).toLocaleString()}</dd>
    </div>
  );
}
