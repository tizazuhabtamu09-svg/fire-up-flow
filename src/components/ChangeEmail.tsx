import { useState } from "react";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n";

const cls = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:border-primary";

/**
 * Change the registered sign-in email. A verification code is sent to the NEW
 * address and the change is only applied once that code is entered, so nobody
 * can move an account to an address they don't own. Available to every role.
 */
export function ChangeEmail({ currentEmail }: { currentEmail?: string | null }) {
  const { t } = useLanguage();
  const [step, setStep] = useState<"idle" | "email" | "code">("idle");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const next = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(next)) return setError(t("auth.invalidEmail"));
    if (next === (currentEmail ?? "").toLowerCase()) return setError(t("auth.alreadyYourEmail"));
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser(
      { email: next },
      { emailRedirectTo: `${window.location.origin}/profile` },
    );
    setBusy(false);
    if (err) return setError(err.message);
    setInfo(t("auth.verificationCodeSentTo", { email: next }));
    setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email_change",
    });
    setBusy(false);
    if (err) return setError(err.message);
    setInfo(t("auth.emailUpdated"));
    setStep("idle");
    setCode("");
  }

  if (step === "idle") {
    return (
      <div className="space-y-2">
        <button onClick={() => { setStep("email"); setInfo(null); }} className="btn-outline-brand inline-flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4" /> {t("auth.changeEmailAddress")}
        </button>
        {info && <p className="text-sm text-muted-foreground">{info}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={step === "email" ? requestCode : verify} className="card-soft space-y-4 p-6">
      <div>
        <h2 className="text-lg font-bold">{t("auth.changeEmailAddress")}</h2>
        <p className="text-sm text-muted-foreground">
          {step === "email"
            ? t("auth.changeEmailDesc")
            : info}
        </p>
      </div>

      {step === "email" ? (
        <label className="block">
          <span className="text-sm font-medium">{t("auth.newEmail")}</span>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={cls} />
        </label>
      ) : (
        <label className="block">
          <span className="text-sm font-medium">{t("auth.verificationCode")}</span>
          <input
            required
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("auth.sixDigitCodePlaceholder")}
            className={cls}
          />
        </label>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button disabled={busy} className="btn-brand text-sm disabled:opacity-60">
          {busy ? t("auth.pleaseWait") : step === "email" ? t("auth.sendVerificationCode") : t("auth.confirmNewEmail")}
        </button>
        <button type="button" onClick={() => { setStep("idle"); setError(null); }} className="btn-outline-brand text-sm">
          {t("auth.cancel")}
        </button>
      </div>
    </form>
  );
}
