import type { Database } from "@/integrations/supabase/types";

export type EmployeeRequest = Database["public"]["Tables"]["employee_requests"]["Row"];
export type HiredEmployee = Database["public"]["Tables"]["hired_employees"]["Row"];
export type IncidentReport = Database["public"]["Tables"]["incident_reports"]["Row"];

export const REQUEST_STATUS = {
  PENDING_ADMIN_REVIEW: { label: "Pending admin review", tone: "bg-amber-100 text-amber-800" },
  PENDING_PAYMENT: { label: "Pending payment", tone: "bg-sky-100 text-sky-800" },
  AWAITING_PAYMENT_VERIFICATION: { label: "Awaiting payment verification", tone: "bg-indigo-100 text-indigo-800" },
  COMPLETED: { label: "Completed", tone: "bg-emerald-100 text-emerald-800" },
  DECLINED: { label: "Declined", tone: "bg-rose-100 text-rose-800" },
} as const;

export type RequestStatus = keyof typeof REQUEST_STATUS;

export function statusMeta(status: string) {
  return (
    REQUEST_STATUS[status as RequestStatus] ?? {
      label: status.replaceAll("_", " ").toLowerCase(),
      tone: "bg-secondary text-foreground",
    }
  );
}

/** Itemised total the employer has to pay: base salary + service fee + allowances. */
export function requestTotal(r: Pick<EmployeeRequest, "salary" | "service_fee" | "allowances">) {
  return Number(r.salary ?? 0) + Number(r.service_fee ?? 0) + Number(r.allowances ?? 0);
}

/* ------------------------------------------------------------------ */
/* Incident report intake forms                                        */
/* ------------------------------------------------------------------ */

export type ReportField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "date" | "datetime" | "toggle";
  options?: string[];
  required?: boolean;
  maxLength?: number;
  showIf?: { field: string; value: string };
};

export type ReportCategory = "security" | "behavior";

export const REPORT_CATEGORIES: { value: ReportCategory; title: string; description: string }[] = [
  {
    value: "security",
    title: "Security & major compliance incident",
    description: "Property loss, unauthorised access, policy violation or severe misconduct.",
  },
  {
    value: "behavior",
    title: "Workplace behaviour & performance",
    description: "Attendance, punctuality, non-compliance or low productivity concerns.",
  },
];

export const REPORT_FORMS: Record<ReportCategory, ReportField[]> = {
  security: [
    {
      name: "incident_category",
      label: "Incident category",
      type: "select",
      options: ["Property Loss", "Unauthorized Access", "Policy Violation", "Severe Misconduct", "Other"],
      required: true,
    },
    { name: "occurred_at", label: "Date & time of the incident", type: "datetime", required: true },
    { name: "account", label: "Detailed account of what happened", type: "textarea", required: true, maxLength: 4000 },
    { name: "authorities_notified", label: "External authorities notified?", type: "toggle", options: ["Yes", "No"], required: true },
    {
      name: "case_reference",
      label: "External case / reference number",
      type: "text",
      required: true,
      showIf: { field: "authorities_notified", value: "Yes" },
    },
  ],
  behavior: [
    {
      name: "behavior_type",
      label: "Behaviour type",
      type: "select",
      options: ["Attendance Issue", "Punctuality", "Non-Compliance", "Low Productivity", "Other"],
      required: true,
    },
    { name: "occurred_on", label: "Date of event", type: "date", required: true },
    { name: "severity", label: "Severity rating", type: "select", options: ["Low", "Medium", "High"], required: true },
    { name: "summary", label: "Summary notes", type: "textarea", required: true, maxLength: 2000 },
  ],
};

export function reportTitle(category: string) {
  return category === "security" ? "Security & compliance incident" : "Workplace behaviour & performance";
}

/** Builds the standardised summary that gets dispatched to the authorities. */
export function buildAuthorityEmail(report: IncidentReport, filedBy: string) {
  const details = (report.details ?? {}) as Record<string, string>;
  const lines = [
    "STANDARDISED INCIDENT NOTIFICATION — Agaze/አጋዝ",
    "",
    `Case reference: ${report.id}`,
    `Filed on: ${new Date(report.created_at).toLocaleString()}`,
    `Category: ${reportTitle(report.category)}`,
    "",
    "PARTIES",
    `Reporting employer: ${filedBy}`,
    `Worker named in the report: ${report.worker_name}`,
    "",
    "INCIDENT DETAILS",
    ...Object.entries(details).map(([k, v]) => `- ${k.replaceAll("_", " ")}: ${v}`),
    "",
    `Attached evidence files: ${((report.attachments ?? []) as string[]).length}`,
    "",
    "This notification was generated automatically by the Agaze compliance panel.",
  ];
  return lines.join("\n");
}
