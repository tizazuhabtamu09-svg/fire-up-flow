import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Project-specific replacement for the generated `requireSupabaseAuth`.
 *
 * The generated middleware only validates through `auth.getClaims(token)`, which
 * fails hard ("Unauthorized: Invalid token") whenever the published deployment
 * cannot verify the JWT locally (signing-key rotation, asymmetric keys not yet
 * cached, clock skew). Here we fall back to `auth.getUser(token)`, which asks
 * the Auth server directly, so a genuinely valid session is never rejected.
 *
 * It exposes exactly the same context as the generated one:
 * `{ supabase, userId, claims }`.
 */
function isOpaqueKey(value: string) {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function supabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (isOpaqueKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

export const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const url = process.env["SUPABASE_URL"];
  const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !publishableKey) throw new Error("Server is missing its backend configuration.");

  const request = getRequest();
  const authHeader = request?.headers?.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Your session has expired. Please sign in again.");
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (token.split(".").length !== 3) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const supabase = createClient<Database>(url, publishableKey, {
    global: {
      fetch: supabaseFetch(publishableKey),
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  // Fast path: local/JWKS claim verification.
  let userId: string | undefined;
  let claims: Record<string, unknown> = {};
  const { data: claimData } = await supabase.auth.getClaims(token);
  if (claimData?.claims?.sub) {
    userId = claimData.claims.sub;
    claims = claimData.claims as unknown as Record<string, unknown>;
  } else {
    // Fallback: ask the Auth server to validate the token.
    const { data: userData, error } = await supabase.auth.getUser(token);
    if (error || !userData?.user) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    userId = userData.user.id;
    claims = { sub: userData.user.id, email: userData.user.email };
  }

  return next({ context: { supabase, userId: userId!, claims } });
});
