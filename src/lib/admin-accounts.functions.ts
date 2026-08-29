import { createServerFn } from "@tanstack/react-start";
import { requireAuth as requireSupabaseAuth } from "@/lib/auth-guard";

type ManagedRole = "employee" | "employer" | "broker" | "kyc";

/**
 * Primary-admin check. Sub-admins hold the `admin` role for console access, so
 * an active `sub_admins` record disqualifies them from administrative
 * endpoints — only the primary admin may create admin/sub-admin/KYC accounts.
 */
async function assertPrimaryAdmin(context: { supabase: { rpc: Function; from: Function }; userId: string }) {
  const [{ data: isAdmin }, { data: sub }, { data: me }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.from("sub_admins").select("id, active").eq("user_id", context.userId).maybeSingle(),
    context.supabase.from("profiles").select("role").eq("id", context.userId).maybeSingle(),
  ]);
  if (sub?.active) throw new Error("Sub-admins cannot create administrative accounts.");
  // `user_roles` may not carry a row for the original admin account, so the
  // profile role counts as well (the client-side staff check does the same).
  if (!isAdmin && me?.role !== "admin") throw new Error("Forbidden");
}

/**
 * Creates a confirmed sign-in account for an Employee, Employer, Broker or KYC
 * officer. Admin only. Returns the generated password so the console can show
 * it once.
 */
export const createManagedAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    email: string;
    full_name: string;
    role: ManagedRole;
    phone?: string;
    city?: string;
    password?: string;
    verified?: boolean;
  }) => {
    const email = String(input.email ?? "").trim().toLowerCase();
    const full_name = String(input.full_name ?? "").trim();
    const role = input.role;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Enter a valid email address.");
    if (!full_name || full_name.length > 120) throw new Error("Enter a full name (max 120 characters).");
    if (!["employee", "employer", "broker", "kyc"].includes(role)) throw new Error("Unsupported role.");
    if (input.password && input.password.length < 8) throw new Error("Password must be at least 8 characters.");
    return {
      email,
      full_name,
      role,
      phone: String(input.phone ?? "").trim().slice(0, 30),
      city: String(input.city ?? "").trim().slice(0, 120),
      password: input.password ? String(input.password) : undefined,
      verified: Boolean(input.verified),
    };
  })
  .handler(async ({ data, context }) => {
    await assertPrimaryAdmin(context);
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    const bytes = crypto.getRandomValues(new Uint8Array(14));
    const generated = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
    const password = data.password ?? generated;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, phone: data.phone, role: data.role },
    });
    if (error || !created.user) {
      const msg = error?.message ?? "Could not create the account.";
      throw new Error(
        /already been registered|already exists/i.test(msg)
          ? `An account with ${data.email} already exists. Use a different email address.`
          : msg,
      );
    }

    // If anything after the auth user is created fails, remove the auth user
    // again — otherwise the address is taken by an account whose one-time
    // password was never shown, and the person can never sign in.
    try {
      // Upsert: there is no auth trigger creating profile rows, so a plain
      // update would silently touch 0 rows and leave the account role-less.
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: created.user.id,
            full_name: data.full_name,
            phone: data.phone || null,
            city: data.city || null,
            role: data.role,
            must_change_password: true,
            verification_status: data.verified || data.role === "kyc" ? "approved" : "pending",
            verified_at: data.verified || data.role === "kyc" ? new Date().toISOString() : null,
          },
          { onConflict: "id" },
        );
      if (profileError) throw new Error(profileError.message);

      // KYC officers are back-office staff: grant the role explicitly so login
      // routes them straight to the back office instead of the role picker.
      if (data.role === "kyc") {
        await supabaseAdmin.from("user_roles").upsert(
          { user_id: created.user.id, role: "kyc" },
          { onConflict: "user_id,role" },
        );
      }
    } catch (err) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id).catch(() => {});
      throw err;
    }

    return { userId: created.user.id, email: data.email, password };


  });

/**
 * Creates a sub-admin: a sign-in account with console access plus the
 * sub_admins record that stores their permissions. Admin only.
 */
export const createSubAdminAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    full_name: string;
    email: string;
    phone?: string;
    fayda_number?: string;
    age?: number | null;
    sex?: "male" | "female" | "other" | null;
    city?: string;
    woreda?: string;
    permissions?: Record<string, boolean>;
  }) => {
    const email = String(input.email ?? "").trim().toLowerCase();
    const full_name = String(input.full_name ?? "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Enter a valid email address.");
    if (!full_name || full_name.length > 120) throw new Error("Enter a full name (max 120 characters).");
    return {
      email,
      full_name,
      phone: String(input.phone ?? "").trim().slice(0, 30),
      fayda_number: String(input.fayda_number ?? "").trim().slice(0, 60),
      age: input.age && Number.isFinite(input.age) ? Number(input.age) : null,
      sex: input.sex ?? null,
      city: String(input.city ?? "").trim().slice(0, 120),
      woreda: String(input.woreda ?? "").trim().slice(0, 120),
      permissions: input.permissions ?? {},
    };
  })
  .handler(async ({ data, context }) => {
    await assertPrimaryAdmin(context);
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    const bytes = crypto.getRandomValues(new Uint8Array(14));
    const password = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, phone: data.phone, role: "employer" },
    });

    let userId: string;
    let isExisting = false;

    if (error || !created?.user) {
      const msg = error?.message ?? "Could not create the account.";
      if (!/already been registered|already exists/i.test(msg)) throw new Error(msg);

      // The auth account already exists (e.g. this person signed up before, or a
      // previous attempt half-succeeded). Reuse it and promote it to sub-admin
      // instead of dead-ending the admin.
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = list?.users?.find((u) => (u.email ?? "").toLowerCase() === data.email);
      if (!existing) {
        throw new Error(
          `An account with ${data.email} already exists but could not be loaded. Use a different email address.`,
        );
      }
      userId = existing.id;
      isExisting = true;

      const { data: alreadySub } = await supabaseAdmin
        .from("sub_admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (alreadySub) throw new Error(`${data.email} is already a sub-admin.`);

      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });
      if (pwError) throw new Error(pwError.message);
    } else {
      userId = created.user.id;
    }

    try {
      await supabaseAdmin.from("profiles").upsert(
        {
          id: userId,
          full_name: data.full_name,
          phone: data.phone || null,
          city: data.city || null,
          role: "admin",
          must_change_password: true,
          verification_status: "approved",
          verified_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

      const { error: subError } = await supabaseAdmin.from("sub_admins").insert({
        user_id: userId,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        fayda_number: data.fayda_number || null,
        age: data.age,
        sex: data.sex,
        city: data.city || null,
        woreda: data.woreda || null,
        permissions: data.permissions,
        created_by: context.userId,
      });
      if (subError) throw new Error(subError.message);
    } catch (err) {
      // Roll back only accounts we created here; never delete a pre-existing user.
      if (!isExisting) await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
      throw err;
    }



    return { userId, email: data.email, password };
  });

/** Any admin (primary or sub-admin) may manage regular accounts. */
async function assertAdmin(context: { supabase: { rpc: Function; from: Function }; userId: string }) {
  const [{ data: isAdmin }, { data: me }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.from("profiles").select("role").eq("id", context.userId).maybeSingle(),
  ]);
  if (!isAdmin && me?.role !== "admin") throw new Error("Forbidden");
}

/**
 * Permanently deletes a user: the auth account plus every profile/role row that
 * cascades from it. Admin only. Admin-level accounts may only be removed by the
 * primary admin, and nobody may delete themselves.
 */
export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    const userId = String(input.userId ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error("Invalid user reference.");
    return { userId };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("You cannot delete your own account.");

    const { data: target } = await context.supabase
      .from("profiles")
      .select("role")
      .eq("id", data.userId)
      .maybeSingle();
    if (target?.role === "admin") await assertPrimaryAdmin(context);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("sub_admins").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error && !/not found/i.test(error.message)) throw new Error(error.message);
    return { ok: true };
  });

/** Admin-set a new password for any non-admin account. */
export const setUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; password: string }) => {
    const userId = String(input.userId ?? "").trim();
    const password = String(input.password ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error("Invalid user reference.");
    if (password.length < 8) throw new Error("Password must be at least 8 characters.");
    return { userId, password };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("profiles").update({ must_change_password: true }).eq("id", data.userId);
    return { ok: true };
  });
