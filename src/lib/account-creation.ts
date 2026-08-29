export type CreatableRole = "employee" | "employer" | "broker" | "kyc" | "sub_admin";

export type CreatorKind = "admin" | "sub_admin" | "broker";

/** Which roles each kind of creator may register. */
export const CREATION_SCOPE: Record<CreatorKind, CreatableRole[]> = {
  admin: ["sub_admin", "kyc", "employer", "employee", "broker"],
  sub_admin: ["employer", "employee", "broker"],
  broker: ["employer", "employee"],

};

export const CREATABLE_ROLES: CreatableRole[] = ["employee", "employer", "broker", "kyc", "sub_admin"];

export const roleTitle: Record<CreatableRole, string> = {
  employee: "Employee",
  employer: "Employer",
  broker: "Broker",
  kyc: "KYC reviewer",
  sub_admin: "Sub-Admin",
};

export const text = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);

export const numOrNull = (v: unknown) => {
  const n = Number(v);
  return v === "" || v === null || v === undefined || !Number.isFinite(n) ? null : n;
};

export function randomPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
