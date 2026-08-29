import { createContext, useContext } from "react";

export type StaffKind = "admin" | "sub-admin" | "kyc";

export type StaffContext = {
  userId: string;
  name: string;
  kind: StaffKind;
  isAdmin: boolean;
  isKyc: boolean;
  permissions: Record<string, boolean>;
};

export const staffContext = createContext<StaffContext | null>(null);

export function useStaff(): StaffContext {
  const value = useContext(staffContext);
  if (!value) throw new Error("useStaff must be used inside the back-office layout");
  return value;
}

/** Admins have every privilege; KYC reviewers always review payments;
 *  sub-admins get whatever an admin granted them. */
export function staffCan(staff: StaffContext, permission: string): boolean {
  if (staff.isAdmin) return true;
  if (permission === "payments" && staff.isKyc) return true;
  return Boolean(staff.permissions[permission]);
}
