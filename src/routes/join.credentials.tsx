import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { loadDraft } from "@/lib/onboarding-draft";
import { joinPathForRole, type OnboardingRole } from "@/lib/onboarding";
import { PENDING_ROLE_KEY } from "@/routes/oauth-callback";
import { BRAND } from "@/lib/app-config";

export const Route = createFileRoute("/join/credentials")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Create your account — ${BRAND.fullName}` },
      { name: "description", content: `Final step: choose how you sign in to ${BRAND.name} and your registration is complete.` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CredentialsStep,
});

const inputWrap =
  "mt-1 flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2.5 focus-within:border-primary transition";
const inputBase = "w-full bg-transparent outline-none placeholder:text-muted-foreground/70";

const roleTitle: Record<OnboardingRole, string> = { employee: "Employee", employer: "Employer", broker: "Broker" };

function CredentialsStep() {
  const navigate = useNavigate();
  const [role, setRole] = useState<OnboardingRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadDraft();
    if (!draft) {
      navigate({ to: "/join", replace: true });
      return;
    }
    setRole(draft.role);
    setEmail(draft.values.email ?? "");
  }, [navigate]);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const draft = loadDraft();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${joinPathForRole[role]}`,
          data: { full_name: draft?.values.full_name ?? "", phone: draft?.values.phone ?? "", role, onboarding_role: role },
        },
      });
      if (error) throw error;
      // No email confirmation step: sign the user straight in and continue.
      if (!data.session) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;
      }
      navigate({ to: joinPathForRole[role], replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    if (!role) return;
    setError(null);
    window.localStorage.setItem(PENDING_ROLE_KEY, role);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/oauth-callback`,
    });
    if (result.error) {
      setError(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/oauth-callback", replace: true });
  }

  if (!role) return <div className="container-page py-24 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-md">
        <Steps current={3} />
        <Link to={joinPathForRole[role]} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to your details
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registering as <span className="font-semibold text-foreground">{roleTitle[role]}</span>. Your details are saved — just pick how you'll sign in.
        </p>

        <form onSubmit={createAccount} className="card-soft mt-6 space-y-4 p-6">
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <div className={inputWrap}>
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputBase} placeholder="you@example.com" />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium">New password</span>
            <div className={inputWrap}>
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputBase} placeholder="At least 8 characters" />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Confirm password</span>
            <div className={inputWrap}>
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input required type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputBase} placeholder="Repeat your password" />
            </div>
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button disabled={loading} className="btn-brand w-full disabled:opacity-60">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={onGoogle}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 py-3 font-semibold transition hover:bg-secondary"
        >
          <span className="text-lg">G</span> Sign up with Google
        </button>
      </div>
    </div>
  );
}

export function Steps({ current }: { current: 1 | 2 | 3 }) {
  const labels = ["Role", "Your details", "Account"];
  return (
    <ol className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold">
      {labels.map((label, i) => {
        const step = i + 1;
        const active = step <= current;
        return (
          <li
            key={label}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${active ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {step}
            </span>
            <span className="whitespace-nowrap">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
