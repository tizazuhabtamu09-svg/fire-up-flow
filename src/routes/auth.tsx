import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import type { AppRole } from "@/lib/use-session";
import { isStaffUser } from "@/lib/onboarding";
import { PENDING_ROLE_KEY } from "@/routes/oauth-callback";
import { BRAND } from "@/lib/app-config";
import { useLanguage } from "@/lib/i18n";
import { signInWithPhone } from "@/lib/phone-login.functions";

/** Staff land in the back office; everyone else continues to their dashboard. */
async function routeAfterAuth(userId: string | undefined, navigate: (opts: { to: string; replace?: boolean }) => void) {
  const id = userId ?? (await supabase.auth.getUser()).data.user?.id;
  if (id && (await isStaffUser(id))) navigate({ to: "/backoffice", replace: true });
  else navigate({ to: "/dashboard" });
}

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: `Sign in — ${BRAND.fullName}` },
      { name: "description", content: `Sign in or create a ${BRAND.fullName} account to hire trusted domestic workers or find work.` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";
type Step = "form" | "otp-request" | "otp-verify" | "forgot" | "check-email";

const inputWrap =
  "mt-1 flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2.5 focus-within:border-primary transition";
const inputBase = "w-full bg-transparent outline-none placeholder:text-muted-foreground/70";

function AuthPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState<Step>("form");

  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<AppRole>("employer");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) routeAfterAuth(data.session.user.id, navigate);
    });
  }, [navigate]);

  function reset(next: Step) {
    setError(null);
    setInfo(null);
    setStep(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, phone, role },
          },
        });
        if (error) throw error;
        // Email confirmation is not required at sign-up: the account is active
        // immediately and the user lands on their dashboard.
        if (!data.session) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) throw signInErr;
        }
        await routeAfterAuth(data.user?.id, navigate);
      } else if (identifier.includes("@")) {
        const { error } = await supabase.auth.signInWithPassword({ email: identifier.trim(), password });
        if (error) throw error;
        await routeAfterAuth(undefined, navigate);
      } else {
        // Phone sign-in: the server resolves the phone to the account.
        const result = await signInWithPhone({ data: { phone: identifier.trim(), password } });
        if ("error" in result) throw new Error(result.error);
        const { error } = await supabase.auth.setSession(result.session);
        if (error) throw error;
        await routeAfterAuth(undefined, navigate);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setInfo(t("auth.codeSentTo", { email }));
      setStep("otp-verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.couldNotSendCode"));
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
      if (error) throw error;
      await routeAfterAuth(undefined, navigate);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.invalidOrExpiredCode"));
    } finally {
      setLoading(false);
    }
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setInfo(t("auth.resetLinkSent"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.couldNotSendReset"));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError(null);
    // Remember the role picked on the sign-up tab so the callback can open the
    // matching registration form straight after Google returns.
    if (mode === "signup" && (role === "employee" || role === "employer" || role === "broker")) {
      window.localStorage.setItem(PENDING_ROLE_KEY, role);
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/oauth-callback`,
    });
    if (result.error) {
      setError(result.error.message ?? t("auth.googleSignInFailed"));
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/oauth-callback", replace: true });
  }

  return (
    <div className="container-page grid min-h-[calc(100vh-4rem)] place-items-center py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("auth.backToHome")}
        </Link>

        <div className="card-soft p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl font-amharic text-2xl"
              style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}
            >
              አ
            </span>
            <h1 className="mt-4 text-2xl font-bold">
              {step === "forgot"
                ? t("auth.resetYourPassword")
                : step === "otp-request" || step === "otp-verify"
                  ? t("auth.signInWithCode")
                  : mode === "signin"
                    ? t("auth.welcomeBack")
                    : t("auth.createYourAccount")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === "forgot"
                ? t("auth.wellEmailResetLink")
                : step === "otp-verify"
                  ? t("auth.enterSixDigitCode")
                  : mode === "signin"
                    ? t("auth.signInToAccount")
                    : t("auth.joinInUnderMinute", { name: BRAND.name })}
            </p>
          </div>

          {step === "form" && (
            <>
              <div className="mb-6 grid grid-cols-2 rounded-full bg-secondary p-1 text-sm font-semibold">
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                      setError(null);
                    }}
                    className={`rounded-full py-2 transition ${mode === m ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                  >
                    {m === "signin" ? t("auth.signIn") : t("auth.signUp")}
                  </button>
                ))}
              </div>

              {mode === "signup" && (
                <div className="mb-6">
                  <p className="mb-2 text-sm font-medium">{t("auth.signUpAs")}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { to: "/join/employee", label: t("auth.roleEmployee"), am: "ሰራተኛ", icon: "🧑‍🔧" },
                      { to: "/join/employer", label: t("auth.roleEmployer"), am: "ቀጣሪ", icon: "🏠" },
                      { to: "/join/broker", label: t("auth.roleBroker"), am: "ደላላ", icon: "🤝" },
                    ] as const).map((r) => (
                      <Link
                        key={r.to}
                        to={r.to}
                        className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card px-2 py-3 text-center transition hover:border-primary hover:bg-secondary"
                      >
                        <span className="text-xl">{r.icon}</span>
                        <span className="text-xs font-semibold">{r.label}</span>
                        <span className="font-amharic text-[11px] text-muted-foreground">{r.am}</span>
                      </Link>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("auth.pickRoleHint")}
                  </p>
                </div>
              )}


              <form onSubmit={onSubmit} className="space-y-4">
                {mode === "signup" && (
                  <>
                    <div>
                      <label className="text-sm font-medium">{t("auth.fullName")}</label>
                      <div className={inputWrap}>
                        <User className="h-4 w-4 text-muted-foreground" />
                        <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Abebe Kebede" className={inputBase} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t("auth.phone")}</label>
                      <div className={inputWrap}>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251 9.." className={inputBase} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t("auth.iAmA")}</label>
                      <div className="mt-1 grid grid-cols-3 gap-2">
                        {(["employer", "employee", "broker"] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={`rounded-xl border px-2 py-2 text-xs font-semibold capitalize transition ${
                              role === r ? "border-primary bg-secondary" : "border-border text-muted-foreground"
                            }`}
                          >
                            {r === "employee" ? t("auth.worker") : r === "employer" ? t("auth.roleEmployer") : t("auth.roleBroker")}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-sm font-medium">{mode === "signin" ? "Phone or email" : t("auth.email")}</label>
                  <div className={inputWrap}>
                    {mode === "signin" ? <Phone className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-muted-foreground" />}
                    {mode === "signin" ? (
                      <input
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="+251 9.. or you@example.com"
                        className={inputBase}
                      />
                    ) : (
                      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.enterYourEmail")} className={inputBase} />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">{t("auth.password")}</label>
                  <div className={inputWrap}>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <input
                      required
                      minLength={6}
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("auth.enterYourPassword")}
                      className={inputBase}
                    />
                    <button type="button" onClick={() => setShowPw((v) => !v)} className="text-muted-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <button type="submit" disabled={loading} className="btn-brand w-full disabled:opacity-60">
                  {loading ? t("auth.pleaseWait") : mode === "signin" ? t("auth.signIn") : t("auth.createAccount")}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> {t("auth.or")} <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-3">
                <button type="button" onClick={onGoogle} className="flex w-full items-center justify-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 font-medium transition hover:bg-secondary">
                  <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  {t("auth.continueWithGoogle")}
                </button>
                <button
                  type="button"
                  onClick={() => reset("otp-request")}
                  className="btn-outline-brand flex w-full items-center justify-center gap-2"
                >
                  <Mail className="h-4 w-4" /> {t("auth.signInWithCode")}
                </button>
              </div>

              <p className="mt-5 text-center text-sm">
                <button onClick={() => reset("forgot")} className="font-medium" style={{ color: "var(--brand-dark)" }}>
                  {t("auth.forgotPassword")}
                </button>
              </p>
            </>
          )}

          {step === "otp-request" && (
            <form onSubmit={sendCode} className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t("auth.email")}</label>
                <div className={inputWrap}>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.enterYourEmail")} className={inputBase} />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button disabled={loading} className="btn-brand w-full disabled:opacity-60">{loading ? t("auth.sending") : t("auth.sendCode")}</button>
              <BackLink onClick={() => reset("form")} />
            </form>
          )}

          {step === "otp-verify" && (
            <form onSubmit={verifyCode} className="space-y-4">
              {info && <p className="text-sm text-muted-foreground">{info}</p>}
              <div>
                <label className="text-sm font-medium">{t("auth.sixDigitCode")}</label>
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-primary"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button disabled={loading} className="btn-brand w-full disabled:opacity-60">{loading ? t("auth.verifying") : t("auth.verifyAndSignIn")}</button>
              <BackLink onClick={() => reset("otp-request")} label={t("auth.useDifferentEmail")} />
            </form>
          )}

          {step === "forgot" && (
            <form onSubmit={sendReset} className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t("auth.email")}</label>
                <div className={inputWrap}>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.enterYourEmail")} className={inputBase} />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {info && <p className="text-sm text-muted-foreground">{info}</p>}
              <button disabled={loading} className="btn-brand w-full disabled:opacity-60">{loading ? t("auth.sending") : t("auth.sendResetLinkBtn")}</button>
              <BackLink onClick={() => reset("form")} />
            </form>
          )}

          {step === "check-email" && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">{info}</p>
              <button onClick={() => { setMode("signin"); reset("form"); }} className="btn-brand w-full">{t("auth.backToSignIn")}</button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("auth.termsNotice")}
        </p>
      </div>
    </div>
  );
}

function BackLink({ onClick, label }: { onClick: () => void; label?: string }) {
  const { t } = useLanguage();
  return (
    <button type="button" onClick={onClick} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
      ← {label ?? t("auth.backToSignIn")}
    </button>
  );
}
