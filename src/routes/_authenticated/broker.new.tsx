import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useProfile } from "@/lib/use-session";
import { money } from "@/lib/app-config";
import { usePricing } from "@/lib/pricing";
import { registrationLimitError } from "@/lib/subscriptions";
import { RegistrationForm, type RegistrationValues, type RegistrationFiles } from "@/components/RegistrationForm";
import { uploadFile } from "@/lib/uploads";
import { createRegisteredAccount } from "@/lib/account-creation.functions";
import { CredentialsModal } from "@/components/admin/CreateStaffForms";
import { WalletBar } from "@/components/WalletBar";
import { BrokerNav } from "@/components/BrokerNav";
import { BrokerLock } from "@/components/BrokerLock";

export const Route = createFileRoute("/_authenticated/broker/new")({
  head: () => ({
    meta: [
      { title: "Add employee — Agaze/አጋዝ" },
      { name: "description", content: "Register a new employee under your broker account on Agaze." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AddEmployeePage,
});

function AddEmployeePage() {
  useNavigate();
  const { user } = useSession();
  const { profile, setProfile } = useProfile(user?.id);
  // Subscription-aware pricing: a package with free registrations shows 0 here.
  const { fee, loading } = usePricing(user?.id);
  const amount = fee("register_employee");
  const create = useServerFn(createRegisteredAccount);
  const [credentials, setCredentials] = useState<{ email: string; password: string; kind: string } | null>(null);
  const [formKey, setFormKey] = useState(0);

  async function submit(v: RegistrationValues, files: RegistrationFiles): Promise<string | null> {
    if (!user) return "You must be signed in.";
    if (!v.email.trim()) return "An email address is required — it becomes the sign-in username for the employee.";
    if (amount > 0 && (profile?.wallet_balance ?? 0) < amount) return "Insufficient wallet balance. Please recharge first.";
    // Feature-limit enforcement from the broker's subscription package.
    const limit = await registrationLimitError(user.id);
    if (limit) return limit;

    const [frontPath, backPath, photoPath, contractPath, educationPath] = await Promise.all([
      files.idFront ? uploadFile("id-documents", user.id, "emp-front", files.idFront) : Promise.resolve(null),
      files.idBack ? uploadFile("id-documents", user.id, "emp-back", files.idBack) : Promise.resolve(null),
      files.photo ? uploadFile("avatars", user.id, "emp-photo", files.photo) : Promise.resolve(null),
      files.contract ? uploadFile("id-documents", user.id, "emp-contract", files.contract) : Promise.resolve(null),
      files.educationDoc ? uploadFile("id-documents", user.id, "emp-education", files.educationDoc) : Promise.resolve(null),
    ]);

    // Same creation path as the "Create accounts" console: a real sign-in
    // account with one-time credentials, plus the worker record.
    try {
      const result = await create({
        data: {
          role: "employee",
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
          education_document: educationPath,
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
          fayda_front: frontPath,
          fayda_back: backPath,
          personal_photo: photoPath,
          contract_path: contractPath,
        },
      });
      if (!("email" in result) || !result.email || !result.password) {
        return ("error" in result && result.error) || "Could not create the account.";
      }

      // Charge the registration fee only once the account really exists.
      // A subscription with free registrations makes the amount 0 — no charge.
      if (amount > 0) {
        const { data: balance } = await supabase.rpc("spend_wallet", {
          _amount: amount,
          _reason: `Employee registration: ${v.full_name}`,
        });
        if (typeof balance === "number") setProfile((p) => (p ? { ...p, wallet_balance: balance } : p));
      }

      setCredentials({ email: result.email, password: result.password, kind: "Employee" });
      setFormKey((k) => k + 1);
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Could not create the account.";
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <BrokerNav />
      <WalletBar balance={profile?.wallet_balance} />
      <h1 className="text-3xl font-bold">Add employee</h1>
      <p className="font-amharic text-muted-foreground">ሰራተኛ ጨምር</p>

      {profile && profile.verification_status !== "approved" ? (
        <BrokerLock status={profile.verification_status} />
      ) : (
      <div className="mt-6">
        <RegistrationForm
          key={formKey}
          variant="employee"
          submitLabel={loading ? "Loading fee…" : amount > 0 ? `Register employee (${money(amount)})` : "Register employee (Free with your plan)"}
          note={
            amount > 0
              ? `An email address is required — it becomes the employee's sign-in username, and a one-time password is shown once after saving. Registering an employee deducts ${money(amount)} from your wallet — this fee is set by the admin.`
              : "An email address is required — it becomes the employee's sign-in username, and a one-time password is shown once after saving. Registration is free with your current subscription."
          }
          showPrice
          showAvailability
          onSubmit={submit}
        />
      </div>
      )}

      {credentials && <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />}
    </div>
  );
}
