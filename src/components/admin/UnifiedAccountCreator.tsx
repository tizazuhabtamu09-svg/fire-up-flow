import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createRegisteredAccount, getCreationScope } from "@/lib/account-creation.functions";
import { roleTitle, type CreatableRole } from "@/lib/account-creation";
import { CredentialsModal } from "@/components/admin/CreateStaffForms";
import { RegistrationForm, emptyRegistration, type RegistrationFiles, type RegistrationValues } from "@/components/RegistrationForm";
import { uploadFile } from "@/lib/uploads";
import { toast } from "sonner";

const PERMISSIONS = [
  { key: "users", label: "Manage users" },
  { key: "verification", label: "Verify documents" },
  { key: "pricing", label: "Manage pricing" },
  { key: "payments", label: "Review payments" },
  { key: "bookings", label: "Manage bookings" },
];

/**
 * One manual registration console shared by admins, sub-admins and verified
 * brokers. It uses the same fields and schema as the public sign-up pages and
 * shows the generated temporary credentials once the account is created.
 */
export function UnifiedAccountCreator({ creatorId, onCreated }: { creatorId: string; onCreated?: () => void }) {
  const scopeFn = useServerFn(getCreationScope);
  const create = useServerFn(createRegisteredAccount);
  const [roles, setRoles] = useState<CreatableRole[] | null>(null);
  const [role, setRole] = useState<CreatableRole>("employee");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [credentials, setCredentials] = useState<{ email: string; password: string; kind: string } | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [scopeError, setScopeError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setScopeError(null);
    setRoles(null);
    // Never leave the console hanging on "Loading…": any failure surfaces an
    // error with a retry instead of an unresolved promise.
    Promise.resolve(scopeFn({ data: undefined }))
      .then((s) => {
        if (!active) return;
        // Staff accounts (sub-admin, KYC) are created under Roles & permissions,
        // so this console only offers the public-facing roles.
        const list = ((s?.roles ?? []) as CreatableRole[]).filter((r) => r !== "sub_admin" && r !== "kyc");
        setRoles(list);
        if (list.length && !list.includes("employee")) setRole(list[0]);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setScopeError(err instanceof Error ? err.message : "Could not load your account-creation permissions.");
      });
    return () => {
      active = false;
    };
  }, [scopeFn, attempt]);

  async function submit(v: RegistrationValues, files: RegistrationFiles): Promise<string | null> {
    if (!v.email.trim()) return "An email address is required to create the sign-in account.";
    try {
      const [front, back, photo, contract, educationDoc] = await Promise.all([
        files.idFront ? uploadFile("id-documents", creatorId, "front", files.idFront) : Promise.resolve(null),
        files.idBack ? uploadFile("id-documents", creatorId, "back", files.idBack) : Promise.resolve(null),
        files.photo ? uploadFile("avatars", creatorId, "profile", files.photo) : Promise.resolve(null),
        files.contract ? uploadFile("id-documents", creatorId, "contract", files.contract) : Promise.resolve(null),
        files.educationDoc ? uploadFile("id-documents", creatorId, "education", files.educationDoc) : Promise.resolve(null),
      ]);
      const result = await create({
        data: {
          role,
          full_name: v.full_name,
          email: v.email,
          phone: v.phone,
          address: v.address,
          city: v.city,
          sub_city: v.sub_city,
          wereda: v.wereda,
          kebele: v.kebele,
          fayda_number: v.fayda_number,
          experience: v.experience,
          education: v.education,
          education_institution: v.has_education ? v.education_institution : undefined,
          education_qualification: v.has_education ? v.education_qualification : undefined,
          education_graduation_year: v.has_education ? v.education_graduation_year : undefined,
          education_document: educationDoc,
          gender: v.gender,
          age: v.age,
          sector: v.sector,
          sector_other: v.sector_other,
          language: v.language,
          language_other: v.language_other,
          price: v.price,
          available: v.available,
          guarantor_name: v.guarantor_name,
          guarantor_phone: v.guarantor_phone,
          guarantor_id_number: v.guarantor_id_number,
          latitude: v.latitude,
          longitude: v.longitude,
          permissions: role === "sub_admin" ? permissions : undefined,
          fayda_front: front,
          fayda_back: back,
          personal_photo: photo,
          contract_path: contract,
        },
      });
      if (!("email" in result) || !result.email || !result.password) {
        const message = ("error" in result && result.error) || "Could not create the account.";
        toast.error("Account not created", { description: message });
        return message;
      }
      toast.success(`${roleTitle[role]} account created`, {
        description: `Sign-in credentials for ${result.email} are shown below — copy them now.`,
      });
      setCredentials({ email: result.email, password: result.password, kind: roleTitle[role] });
      setPermissions({});
      setFormKey((k) => k + 1);
      onCreated?.();
      return null;
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      // A stale/expired session surfaces as an auth error from the server
      // function; tell the user what to do instead of showing raw token text.
      const message = /unauthorized|invalid token|jwt|no authorization header/i.test(raw)
        ? "Your session expired. Please sign in again and retry — nothing was created."
        : raw || "Could not create the account.";
      toast.error("Account not created", { description: message });
      return message;
    }
  }

  if (scopeError) {
    return (
      <div className="card-soft p-6">
        <p className="text-sm text-destructive">{scopeError}</p>
        <button type="button" onClick={() => setAttempt((a) => a + 1)} className="btn-outline-brand mt-3 text-sm">
          Try again
        </button>
      </div>
    );
  }
  if (!roles) return <p className="text-muted-foreground">Loading…</p>;
  if (roles.length === 0) return <p className="text-muted-foreground">You are not allowed to create accounts.</p>;

  const variant = role === "employer" ? "employer" : role === "employee" ? "employee" : "broker";

  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-2xl bg-secondary/60 p-2 text-sm font-semibold">
        {roles.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-full px-4 py-2 transition ${
              role === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {roleTitle[r]}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Same fields as the public {roleTitle[role]} sign-up. A secure temporary password is generated on save and shown
        once — the new account must set their own password on first sign-in.
      </p>

      {role === "sub_admin" && (
        <fieldset className="card-soft mt-4 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Permissions</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PERMISSIONS.map((p) => (
              <label key={p.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(permissions[p.key])}
                  onChange={(e) => setPermissions({ ...permissions, [p.key]: e.target.checked })}
                />
                {p.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-4">
        <RegistrationForm
          key={`${role}-${formKey}`}
          variant={variant}
          initial={emptyRegistration}
          submitLabel={`Create ${roleTitle[role]} account`}
          showPrice={role === "employee"}
          showAvailability={role === "employee"}
          note="An email address is required — it becomes the sign-in username for the new account."
          onSubmit={submit}
        />
      </div>

      {credentials && <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />}
    </div>
  );
}