import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

/**
 * Project-specific bearer attacher. Replaces the generated `attachSupabaseAuth`
 * because that one attaches whatever `getSession()` returns — including a token
 * that already expired while the user was filling in a long form (uploading ID
 * photos can take a while). The server then rejects it with
 * "Unauthorized: Invalid token".
 *
 * Here the token is refreshed proactively when it is expired or within 60s of
 * expiring, so every server function call carries a valid JWT.
 */
const SKEW_SECONDS = 60;

async function freshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return null;

  const expiresAt = session.expires_at ?? 0;
  const stale = expiresAt > 0 && expiresAt - SKEW_SECONDS <= Math.floor(Date.now() / 1000);
  if (!stale) return session.access_token ?? null;

  const { data: refreshed } = await supabase.auth.refreshSession();
  return refreshed.session?.access_token ?? session.access_token ?? null;
}

export const attachFreshSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    let token: string | null = null;
    try {
      token = await freshAccessToken();
    } catch {
      token = null;
    }
    return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
  },
);
