import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { passwordProblem } from "@/components/ChangePassword";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
    { title: "Reset password — Agaze/አጋዝ" },
    { name: "description", content: "Choose a new password for your Agaze/አጋዝ account." },
    { name: "robots", content: "noindex" }]

  }),
  component: ResetPasswordPage
});

const inputCls =
"mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:border-primary";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  // The recovery link carries the session in the URL fragment / code param.
  // Wait until the Supabase client has picked it up before allowing a submit.
  useEffect(() => {
    let active = true;
    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code).catch(() => undefined);
      }
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session) {
        setError("This reset link is invalid or has expired. Request a new one from the sign-in page.");
      }
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const problem = passwordProblem(password, t);
    if (problem) return setError(problem);
    if (password !== confirm) return setError("Passwords don't match.");

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setLoading(false);
      return setError(err.message);
    }
    // Invalidate the recovery session so the new password must be used.
    await supabase.auth.signOut();
    setLoading(false);
    setDone(true);
    setTimeout(() => navigate({ to: "/auth", replace: true }), 1200);
  }

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-md card-soft p-8">
        <h1 className="text-2xl font-bold">{t("ui.set.a.new.password")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("ui.enter.a.new.password.for.your.account")}</p>
        {done ?
        <p className="mt-6 text-sm text-muted-foreground">{t("ui.password.updated.redirecting.you.to.sign.in")}

        </p> :

        <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium">{t("ui.new.password")}</span>
              <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls} />
            
              <span className="mt-1 block text-xs text-muted-foreground">{t("auth.passwordHint")}</span>
            </label>
            <label className="block">
              <span className="text-sm font-medium">{t("ui.confirm.new.password")}</span>
              <input
              required
              minLength={8}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputCls} />
            
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button disabled={loading || !ready} className="btn-brand w-full disabled:opacity-60">
              {loading ? "Saving…" : "Update password"}
            </button>
          </form>
        }
        <p className="mt-6 text-center text-sm">
          <Link to="/auth" className="text-muted-foreground hover:text-foreground">{t("ui.back.to.sign.in")}

          </Link>
        </p>
      </div>
    </div>);

}
