import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchStaffAccess } from "@/lib/onboarding";
import type { Database } from "@/integrations/supabase/types";

export type JobPost = Database["public"]["Tables"]["job_posts"]["Row"];
export type JobApplication = Database["public"]["Tables"]["job_applications"]["Row"];

export type JobStatus =
  | "awaiting_payment"
  | "pending_approval"
  | "published"
  | "rejected"
  | "closed";

export const JOB_STATUS_LABEL: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  pending_approval: "Pending approval",
  published: "Live",
  rejected: "Rejected",
  closed: "Closed",
};

export const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "live_in", label: "Live-in" },
  { value: "temporary", label: "Temporary / contract" },
  { value: "daily", label: "Daily labour" },
];

export function employmentLabel(value: string | null): string {
  return EMPLOYMENT_TYPES.find((t) => t.value === value)?.label ?? "Full time";
}

export type JobAccess = {
  loading: boolean;
  /** Employers and staff may create job posts. */
  canPost: boolean;
  /** Staff (admin, sub-admin, KYC) may approve, reject and close any job. */
  isReviewer: boolean;
  /** Only verified employees may apply. */
  canApply: boolean;
};

/** Who is allowed to post, review or apply to jobs. */
export function useJobAccess(userId: string | undefined): JobAccess {
  const [state, setState] = useState<JobAccess>({
    loading: true,
    canPost: false,
    isReviewer: false,
    canApply: false,
  });

  useEffect(() => {
    let active = true;
    if (!userId) {
      setState({ loading: false, canPost: false, isReviewer: false, canApply: false });
      return;
    }
    (async () => {
      const [staff, { data: profile }, { data: worker }] = await Promise.all([
        fetchStaffAccess(userId),
        supabase.from("profiles").select("role, verification_status").eq("id", userId).maybeSingle(),
        supabase
          .from("workers")
          .select("id, verification_status")
          .eq("user_id", userId)
          .eq("verification_status", "approved")
          .maybeSingle(),
      ]);
      if (!active) return;
      const isEmployer = profile?.role === "employer";
      const isEmployee = profile?.role === "employee";
      setState({
        loading: false,
        canPost: staff.isStaff || isEmployer,
        isReviewer: staff.isStaff,
        canApply:
          Boolean(worker) || (isEmployee && profile?.verification_status === "approved"),
      });
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  return state;
}

/** Latest approved (published) job posts, newest first. Public-safe. */
export function usePublishedJobs(limit = 6) {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("job_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        if (!active) return;
        setJobs(data ?? []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [limit]);

  return { jobs, loading };
}
