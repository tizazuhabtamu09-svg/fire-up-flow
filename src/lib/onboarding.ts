import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/use-session";

export type OnboardingRole = "employee" | "employer" | "broker";

export type OnboardingStatus =
  | { state: "loading" }
  | { state: "staff" }
  | { state: "complete" }
  | { state: "needs-role" }
  | { state: "needs-form"; role: OnboardingRole };

const ONBOARDING_ROLES: OnboardingRole[] = ["employee", "employer", "broker"];

export type StaffAccess = {
  isAdmin: boolean;
  isKyc: boolean;
  isSubAdmin: boolean;
  isStaff: boolean;
};

/**
 * Back office membership. Admin, KYC reviewer and active sub-admin all count.
 * Roles are read from `user_roles` AND `profiles.role` so an account whose role
 * was set on the profile only is still recognised as staff.
 */
export async function fetchStaffAccess(userId: string): Promise<StaffAccess> {
  const [{ data: roles }, { data: profile }, { data: subAdmin }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    supabase.from("sub_admins").select("id, active").eq("user_id", userId).maybeSingle(),
  ]);
  const list = ((roles ?? []) as { role: AppRole }[]).map((r) => r.role);
  if (profile?.role) list.push(profile.role as AppRole);
  const isSubAdmin = Boolean(subAdmin?.active);
  // Sub-admins carry the `admin` role for console access, but they are NOT the
  // primary admin: administrative privileges (creating admin/sub-admin
  // accounts, roles & permissions) belong to the primary admin only.
  const isAdmin = list.includes("admin") && !isSubAdmin;
  const isKyc = list.includes("kyc");
  return { isAdmin, isKyc, isSubAdmin, isStaff: isAdmin || isKyc || isSubAdmin };
}

/**
 * A user may only reach the app once they have picked a role AND submitted the
 * mandatory registration form for that role (an `applications` row). Staff
 * accounts (admin / KYC) are exempt. The picked role is stored on the auth user
 * metadata so a fresh Google sign-up (whose profile role defaults to employer)
 * is still forced through the role picker.
 */
/**
 * Guarantees the signed-in user has a `profiles` row. Some accounts (e.g. Google
 * sign-ups or signups made before the signup trigger existed) can end up without
 * one, which makes them invisible in the back office user list and in the
 * document verification queue. The row is created with `pending` verification so
 * the account shows up for review straight after registration.
 */
export async function ensureProfileRow(userId: string): Promise<void> {
  const { data: existing } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (existing) return;

  const [{ data: userData }, { data: application }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("applications")
      .select("full_name, phone, city, role")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const meta = (userData.user?.user_metadata ?? {}) as {
    full_name?: string;
    phone?: string;
    role?: string;
    onboarding_role?: string;
  };
  const role = (application?.role ?? meta.onboarding_role ?? meta.role ?? "employer") as AppRole;

  await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: application?.full_name ?? meta.full_name ?? userData.user?.email ?? null,
      phone: application?.phone ?? meta.phone ?? null,
      city: application?.city ?? null,
      role,
    },
    { onConflict: "id" },
  );
}

export async function fetchOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  await ensureProfileRow(userId);
  const [staff, { data: application }, { data: userData }, { data: jobApplication }] = await Promise.all([
    fetchStaffAccess(userId),
    supabase.from("applications").select("id").eq("user_id", userId).limit(1).maybeSingle(),
    supabase.auth.getUser(),
    supabase.from("job_applications").select("id").eq("applicant_id", userId).limit(1).maybeSingle(),
  ]);


  // Staff accounts (admin, KYC reviewer, sub-admin) never see the role picker.
  if (staff.isStaff) return { state: "staff" };
  if (application) return { state: "complete" };

  const meta = userData.user?.user_metadata as { onboarding_role?: string; candidate?: boolean } | undefined;
  // Candidates who registered while applying for a job already told us who they
  // are: send them straight to their employee dashboard, where they can finish
  // their profile later under "Update profile".
  if (jobApplication || meta?.candidate) return { state: "complete" };

  const picked = meta?.onboarding_role;
  if (picked && ONBOARDING_ROLES.includes(picked as OnboardingRole)) {
    return { state: "needs-form", role: picked as OnboardingRole };
  }
  return { state: "needs-role" };
}

/** True when the signed-in user belongs to the back office. */
export async function isStaffUser(userId: string): Promise<boolean> {
  const status = await fetchOnboardingStatus(userId);
  return status.state === "staff";
}


export function useOnboardingStatus(userId: string | undefined) {
  const [status, setStatus] = useState<OnboardingStatus>({ state: "loading" });

  useEffect(() => {
    let active = true;
    if (!userId) {
      setStatus({ state: "loading" });
      return;
    }
    setStatus({ state: "loading" });
    fetchOnboardingStatus(userId).then((s) => {
      if (active) setStatus(s);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  return status;
}

/** Persist the chosen role on both the profile and the auth user metadata. */
export async function chooseOnboardingRole(userId: string, role: OnboardingRole) {
  await Promise.all([
    supabase.auth.updateUser({ data: { onboarding_role: role, role } }),
    supabase.from("profiles").upsert({ id: userId, role }, { onConflict: "id" }),
  ]);
}

export const joinPathForRole: Record<OnboardingRole, "/join/employee" | "/join/employer" | "/join/broker"> = {
  employee: "/join/employee",
  employer: "/join/employer",
  broker: "/join/broker",
};
