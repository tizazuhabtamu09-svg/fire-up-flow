import { supabase } from "@/integrations/supabase/client";

/**
 * Employee-side view of "My Employer": a worker can be placed either directly
 * with an app employer (hired_employees) or with a broker-registered employer
 * (assignments). Both shapes are normalised into EmployerMapping.
 */
export type EmployerMapping = {
  kind: "direct" | "broker";
  hiredId: string | null;
  assignmentId: string | null;
  /** Auth user id of the employer (direct placements only — enables chat). */
  employerId: string | null;
  brokerEmployerId: string | null;
  employerName: string;
  employerPhone: string | null;
  employerCity: string | null;
  status: string;
  salary: number | null;
  since: string;
};

export type DirectMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export const EMPLOYER_REPORT_REASONS = [
  "Salary Payment Issue",
  "Violence / Harassment",
  "Working Conditions",
  "Other",
] as const;


/** Max evidence file size for employer reports: 100 MB. */
export const REPORT_MAX_BYTES = 100 * 1024 * 1024;

export async function loadMyWorkerId(userId: string): Promise<string | null> {
  const { data } = await supabase.from("workers").select("id").eq("user_id", userId).maybeSingle();
  return data?.id ?? null;
}

/** Loads every active placement for the signed-in employee. */
export async function loadMyEmployers(
  userId: string,
): Promise<{ workerId: string | null; mappings: EmployerMapping[] }> {
  const workerId = await loadMyWorkerId(userId);
  if (!workerId) return { workerId: null, mappings: [] };

  const [hiresRes, assignmentsRes] = await Promise.all([
    supabase.from("hired_employees").select("*").eq("worker_ref", workerId).neq("status", "terminated"),
    supabase.from("assignments").select("*").eq("worker_ref", workerId).eq("status", "active"),
  ]);
  const hires = hiresRes.data ?? [];
  const assignments = assignmentsRes.data ?? [];

  const employerIds = hires.map((h) => h.employer_id);
  const { data: employers } = employerIds.length
    ? await supabase.from("profiles").select("id, full_name, phone, city").in("id", employerIds)
    : { data: [] as { id: string; full_name: string | null; phone: string | null; city: string | null }[] };

  const brokerEmployerIds = assignments.map((a) => a.employer_ref);
  const { data: brokerEmployers } = brokerEmployerIds.length
    ? await supabase.from("broker_employers").select("id, full_name, phone, city").in("id", brokerEmployerIds)
    : { data: [] as { id: string; full_name: string; phone: string | null; city: string | null }[] };

  const mappings: EmployerMapping[] = [];

  for (const h of hires) {
    const emp = (employers ?? []).find((e) => e.id === h.employer_id);
    mappings.push({
      kind: "direct",
      hiredId: h.id,
      assignmentId: null,
      employerId: h.employer_id,
      brokerEmployerId: null,
      employerName: emp?.full_name ?? h.worker_name ? (emp?.full_name ?? "Employer") : "Employer",
      employerPhone: emp?.phone ?? null,
      employerCity: emp?.city ?? null,
      status: h.status,
      salary: h.salary,
      since: h.created_at,
    });
  }

  for (const a of assignments) {
    const be = (brokerEmployers ?? []).find((b) => b.id === a.employer_ref);
    mappings.push({
      kind: "broker",
      hiredId: null,
      assignmentId: a.id,
      employerId: null,
      brokerEmployerId: a.employer_ref,
      employerName: be?.full_name ?? "Employer",
      employerPhone: be?.phone ?? null,
      employerCity: be?.city ?? null,
      status: a.status,
      salary: null,
      since: a.created_at,
    });
  }

  return { workerId, mappings };
}

/** Loads the conversation with an employer and marks incoming messages read. */
export async function loadConversation(me: string, other: string): Promise<DirectMessage[]> {
  const { data } = await supabase
    .from("direct_messages")
    .select("*")
    .or(
      `and(sender_id.eq.${me},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${me})`,
    )
    .order("created_at", { ascending: true });
  const rows = (data ?? []) as DirectMessage[];
  const unread = rows.filter((m) => m.recipient_id === me && !m.read_at).map((m) => m.id);
  if (unread.length) {
    await supabase.from("direct_messages").update({ read_at: new Date().toISOString() }).in("id", unread);
  }
  return rows;
}

export async function sendDirectMessage(me: string, other: string, body: string) {
  const { error } = await supabase.from("direct_messages").insert({
    sender_id: me,
    recipient_id: other,
    body: body.trim().slice(0, 2000),
  });
  if (error) throw error;
}
