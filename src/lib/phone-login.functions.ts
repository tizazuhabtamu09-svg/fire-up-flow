import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  phone: z.string().min(4).max(30),
  password: z.string().min(1).max(200),
});

/** Normalised digits so "+251 91 234" and "0912 34" can match the same record. */
function digits(v: string) {
  return v.replace(/\D/g, "");
}

/**
 * Sign in with a phone number instead of an email. The phone -> email lookup
 * happens server-side (never exposed to the browser) and the password must be
 * correct before anything is returned.
 */
export const signInWithPhone = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createClient } = await import("@supabase/supabase-js");

    const target = digits(data.phone);
    const last9 = target.slice(-9);

    const { data: rows } = await supabaseAdmin
      .from("profiles")
      .select("id, phone")
      .not("phone", "is", null)
      .limit(2000);

    const match = (rows ?? []).find((r) => {
      const d = digits(r.phone ?? "");
      return d.length >= 6 && (d === target || d.endsWith(last9));
    });
    if (!match) return { error: "No account found with that phone number." } as const;

    const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(match.id);
    const email = userRes?.user?.email;
    if (!email) return { error: "That account has no email sign-in configured." } as const;

    const anon = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: signIn, error } = await anon.auth.signInWithPassword({ email, password: data.password });
    if (error || !signIn.session) return { error: "Incorrect phone number or password." } as const;

    return {
      session: {
        access_token: signIn.session.access_token,
        refresh_token: signIn.session.refresh_token,
      },
    } as const;
  });
