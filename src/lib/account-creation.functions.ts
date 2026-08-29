import { createServerFn } from "@tanstack/react-start";
import { requireAuth as requireSupabaseAuth } from "@/lib/auth-guard";
import {
  CREATABLE_ROLES,
  CREATION_SCOPE,
  numOrNull,
  randomPassword,
  text,
  type CreatableRole,
  type CreatorKind,
} from "@/lib/account-creation";

type Payload = {
  role: CreatableRole;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  sub_city?: string;
  wereda?: string;
  kebele?: string;
  fayda_number?: string;
  experience?: string;
  education?: string;
  education_institution?: string;
  education_qualification?: string;
  education_graduation_year?: string | number | null;
  /** Storage path of the uploaded certificate/diploma, moved to the new user. */
  education_document?: string | null;
  gender?: "" | "male" | "female" | "other";
  age?: string | number | null;
  sector?: string;
  sector_other?: string;
  language?: string;
  language_other?: string;
  price?: string | number | null;
  available?: boolean;
  guarantor_name?: string;
  guarantor_phone?: string;
  guarantor_id_number?: string;
  latitude?: number | null;
  longitude?: number | null;
  permissions?: Record<string, boolean>;
  /** Storage paths uploaded by the creator, moved into the new user's folder. */
  fayda_front?: string | null;
  fayda_back?: string | null;
  personal_photo?: string | null;
  contract_path?: string | null;
};

/**
 * Manual account registration from the back office / broker console. Uses the
 * same fields as the public sign-up forms, generates a temporary password and
 * returns the credentials so the console can display them once.
 */
export const createRegisteredAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Payload) => {
    const email = text(input.email, 200).toLowerCase();
    const full_name = text(input.full_name, 120);
    if (!CREATABLE_ROLES.includes(input.role)) throw new Error("Unsupported role.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Enter a valid email address.");
    if (!full_name) throw new Error("Enter a full name.");
    if (input.role === "employee" && !text(input.sector)) throw new Error("Please choose a sector.");
    return { ...input, email, full_name };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // ---- who is creating, and what are they allowed to create? ----
    const [{ data: isAdmin }, { data: sub }, { data: me }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
      supabase.from("sub_admins").select("id, active").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("role, verification_status, full_name").eq("id", userId).maybeSingle(),
    ]);
    // Sub-admins also hold the `admin` role for console access, so they must be
    // matched FIRST — otherwise they would inherit primary-admin privileges.
    // The profile role counts too: client-side staff access (fetchStaffAccess)
    // already merges profiles.role with user_roles, so the server must agree.
    const isPrimaryAdmin = Boolean(isAdmin) || me?.role === "admin";
    const creator: CreatorKind | null = isPrimaryAdmin
      ? "admin"
      : sub?.active
        ? "sub_admin"
        : me?.role === "broker" && me?.verification_status === "approved"
          ? "broker"
          : null;

    if (!creator) throw new Error("You are not allowed to create accounts.");
    if (!CREATION_SCOPE[creator].includes(data.role)) {
      throw new Error(`You are not allowed to create ${data.role.replace("_", "-")} accounts.`);
    }
    // Hard lock: only the primary admin may ever mint administrative accounts.
    if ((data.role === "sub_admin" || data.role === "kyc") && creator !== "admin") {
      throw new Error("Only the primary admin can create administrative accounts.");
    }

    // Origin metadata: who registered this account and through which console.
    const origin = {
      registration_type: creator,
      registered_by: userId,
      registered_by_name: me?.full_name ?? null,
    };

    const password = randomPassword();
    const profileRole = data.role === "sub_admin" ? "admin" : data.role;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, phone: text(data.phone, 30), role: profileRole },
    });
    if (error || !created.user) {
      const msg = error?.message ?? "Could not create the account.";
      // Return (don't throw) so the console shows a normal form error instead
      // of surfacing an unhandled server-function runtime error.
      return {
        error: /already been registered|already exists|duplicate/i.test(msg)
          ? `An account with ${data.email} already exists. Use a different email address.`
          : msg,
      } as const;
    }
    const newUserId = created.user.id;

    try {


    // Files were uploaded under the creator's folder; move them to the new user.
    async function relocate(bucket: string, path: string | null | undefined) {
      if (!path) return null;
      const name = path.split("/").pop() ?? "file";
      const target = `${newUserId}/${name}`;
      const { error: moveError } = await supabaseAdmin.storage.from(bucket).move(path, target);
      return moveError ? path : target;
    }
    const [faydaFront, faydaBack, photo, contract, educationDoc] = await Promise.all([
      relocate("id-documents", data.fayda_front),
      relocate("id-documents", data.fayda_back),
      relocate("avatars", data.personal_photo),
      relocate("id-documents", data.contract_path),
      relocate("id-documents", data.education_document),
    ]);

    const isStaffRole = data.role === "kyc" || data.role === "sub_admin";

    let applicationId: string | null = null;
    if (!isStaffRole) {
      const { data: app, error: appError } = await supabaseAdmin
        .from("applications")
        .insert({
          user_id: newUserId,
          role: data.role as "employee" | "employer" | "broker",
          full_name: data.full_name,
          email: data.email,
          phone: text(data.phone, 30) || null,
          address: text(data.address) || null,
          city: text(data.city) || null,
          sub_city: text(data.sub_city) || null,
          wereda: text(data.wereda) || null,
          kebele: text(data.kebele) || null,
          fayda_number: text(data.fayda_number, 60) || null,
          fayda_front: faydaFront,
          fayda_back: faydaBack,
          personal_photo: photo,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
        })
        .select("id")
        .single();
      if (appError) throw new Error(appError.message);
      applicationId = app.id;
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: newUserId,
          full_name: data.full_name,
          phone: text(data.phone, 30) || null,
          city: text(data.city) || null,
          avatar_url: photo,
          role: profileRole,
          must_change_password: true,
          verification_status: isStaffRole ? "approved" : "pending",
          verified_at: isStaffRole ? new Date().toISOString() : null,
          ...origin,
        },
        { onConflict: "id" },
      );
    if (profileError) throw new Error(profileError.message);

    if (data.role === "kyc") {
      await supabaseAdmin.from("user_roles").upsert({ user_id: newUserId, role: "kyc" }, { onConflict: "user_id,role" });
    }

    if (data.role === "sub_admin") {
      await supabaseAdmin.from("user_roles").upsert({ user_id: newUserId, role: "admin" }, { onConflict: "user_id,role" });

      const { error: subError } = await supabaseAdmin.from("sub_admins").insert({
        user_id: newUserId,
        full_name: data.full_name,
        email: data.email,
        phone: text(data.phone, 30) || null,
        fayda_number: text(data.fayda_number, 60) || null,
        age: numOrNull(data.age),
        sex: data.gender ? (data.gender as "male" | "female" | "other") : null,
        city: text(data.city) || null,
        woreda: text(data.wereda) || null,
        permissions: data.permissions ?? {},
        created_by: userId,
      });
      if (subError) throw new Error(subError.message);
    }

    if (data.role === "employee") {
      const { error: empError } = await supabaseAdmin.from("employee_profiles").insert({
        application_id: applicationId!,
        user_id: newUserId,
        fayda_number: text(data.fayda_number, 60),
        id_photo_front: faydaFront,
        id_photo_back: faydaBack,
        photo_url: photo,
        contract_path: contract,
        experience: text(data.experience, 800) || null,
        education: text(data.education, 800) || null,
        education_institution: text(data.education_institution, 200) || null,
        education_qualification: text(data.education_qualification, 80) || null,
        education_graduation_year: numOrNull(data.education_graduation_year),
        education_document: educationDoc,
        gender: data.gender ? (data.gender as "male" | "female" | "other") : null,
        age: numOrNull(data.age),
        sector: data.sector as never,
        sector_other: text(data.sector_other, 80) || null,
        language: text(data.language, 200) || null,
        language_other: text(data.language_other, 60) || null,
        guarantor_name: text(data.guarantor_name) || null,
        guarantor_phone: text(data.guarantor_phone, 30) || null,
        guarantor_id_number: text(data.guarantor_id_number, 60) || null,
      });
      if (empError) throw new Error(empError.message);

      const { error: workerError } = await supabaseAdmin.from("workers").insert({
        owner_id: creator === "broker" ? userId : newUserId,
        user_id: newUserId,
        full_name: data.full_name,
        email: data.email,
        phone: text(data.phone, 30) || null,
        sector: data.sector as never,
        sector_other: text(data.sector_other, 80) || null,
        language: text(data.language, 200) || null,
        language_other: text(data.language_other, 60) || null,
        city: text(data.city) || null,
        address: text(data.address) || null,
        sub_city: text(data.sub_city) || null,
        wereda: text(data.wereda) || null,
        kebele: text(data.kebele) || null,
        experience: text(data.experience, 800) || null,
        education: text(data.education, 800) || null,
        education_institution: text(data.education_institution, 200) || null,
        education_qualification: text(data.education_qualification, 80) || null,
        education_graduation_year: numOrNull(data.education_graduation_year),
        education_document: educationDoc,
        gender: data.gender ? (data.gender as "male" | "female" | "other") : null,
        age: numOrNull(data.age),
        price: numOrNull(data.price),
        available: data.available ?? true,
        photo_url: photo,
        fayda_number: text(data.fayda_number, 60) || null,
        fayda_front: faydaFront,
        fayda_back: faydaBack,
        contract_path: contract,
        guarantor_name: text(data.guarantor_name) || null,
        guarantor_phone: text(data.guarantor_phone, 30) || null,
        guarantor_id_number: text(data.guarantor_id_number, 60) || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        ...origin,
      });
      if (workerError) throw new Error(workerError.message);
    }

    if (data.role === "employer" && creator === "broker") {
      const { error: employerError } = await supabaseAdmin.from("broker_employers").insert({
        broker_id: userId,
        full_name: data.full_name,
        email: data.email,
        phone: text(data.phone, 30) || null,
        city: text(data.city) || null,
        address: text(data.address) || null,
        sub_city: text(data.sub_city) || null,
        wereda: text(data.wereda) || null,
        kebele: text(data.kebele) || null,
        fayda_number: text(data.fayda_number, 60) || null,
        fayda_front: faydaFront,
        fayda_back: faydaBack,
        personal_photo: photo,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      });
      if (employerError) throw new Error(employerError.message);
    }
    } catch (err) {
      // Roll back the auth user: otherwise the email is taken by an account
      // whose one-time password was never displayed, and nobody can sign in.
      await supabaseAdmin.auth.admin.deleteUser(newUserId).catch(() => {});
      // Surface the real cause as a form error instead of an opaque
      // "Could not create the account" runtime failure.
      const message = err instanceof Error ? err.message : String(err);
      return { error: message || "Could not create the account." } as const;
    }

    return { userId: newUserId, email: data.email, password, role: data.role };

  });

/** Tells the console which roles the signed-in user may create. */
export const getCreationScope = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: isAdmin }, { data: sub }, { data: me }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
      supabase.from("sub_admins").select("id, active").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("role, verification_status, full_name").eq("id", userId).maybeSingle(),
    ]);
    const isPrimaryAdmin = Boolean(isAdmin) || me?.role === "admin";
    const creator: CreatorKind | null = isPrimaryAdmin
      ? "admin"
      : sub?.active
        ? "sub_admin"
        : me?.role === "broker" && me?.verification_status === "approved"
          ? "broker"
          : null;

    return { creator, roles: creator ? CREATION_SCOPE[creator] : [] };
  });