import { useState } from "react";
import { KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n";
import { pushSecurityNotification } from "@/lib/notifications";

const cls = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:border-primary";

/** Security standard for new passwords, shared by the form and its hint. */
export function passwordProblem(pw: string, t: (key: string) => string): string | null {
  if (pw.length < 8) return t("auth.pwMinLength");
  if (!/[A-Z]/.test(pw)) return t("auth.pwUppercase");
  if (!/[a-z]/.test(pw)) return t("auth.pwLowercase");
  if (!/[0-9]/.test(pw)) return t("auth.pwNumber");
  if (!/[^A-Za-z0-9]/.test(pw)) return t("auth.pwSpecial");
  return null;
}

/**
 * Universal change-password form. Available to every role from account
 * settings, and reused by the forced first-login password change (where the
 * current temporary password must be re-entered).
 */
export function ChangePassword({
  title,
  description,
  confirmRequired = true,
  requireCurrent = false,
  currentLabel,
  onDone,
}: {
  title?: string;
  description?: string;
  confirmRequired?: boolean;
  requireCurrent?: boolean;
  currentLabel?: string;
  onDone?: () => void;
}) {
  const { t } = useLanguage();
  const resolvedTitle = title ?? t("auth.changePassword");
  const resolvedDescription = description ?? t("auth.changePasswordDesc");
  const resolvedCurrentLabel = currentLabel ?? t("auth.currentPassword");
  const [open, setOpen] = useState(!confirmRequired);
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const problem = passwordProblem(password, t);
    if (problem) return setError(problem);
    if (password !== confirm) return setError(t("auth.passwordsDontMatch"));
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (requireCurrent) {
      const email = userData.user?.email;
      if (!email) {
        setSaving(false);
        return setError(t("auth.couldNotVerifyAccount"));
      }
      if (current === password) {
        setSaving(false);
        return setError(t("auth.newPasswordMustDiffer"));
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: current });
      if (signInError) {
        setSaving(false);
        return setError(t("auth.currentPasswordIncorrect"));
      }
    }
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setSaving(false);
      return setError(err.message);
    }

    if (userData.user) {
      await supabase.from("profiles").update({ must_change_password: false }).eq("id", userData.user.id);
      // Security notification feed entry (fire-and-forget).
      void pushSecurityNotification(userData.user.id, t("auth.pwChangedTitle"), t("auth.pwChangedBody"));
    }
    setSaving(false);
    setDone(true);
    setPassword("");
    setConfirm("");
    setCurrent("");
    onDone?.();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-outline-brand inline-flex items-center gap-2 text-sm">
        <KeyRound className="h-4 w-4" /> {resolvedTitle}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card-soft space-y-4 p-6">
      <div>
        <h2 className="text-lg font-bold">{resolvedTitle}</h2>
        <p className="text-sm text-muted-foreground">{resolvedDescription}</p>
      </div>
      {requireCurrent && (
        <label className="block">
          <span className="text-sm font-medium">{resolvedCurrentLabel}</span>
          <input required type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={cls} />
        </label>
      )}
      <label className="block">
        <span className="text-sm font-medium">{t("auth.newPassword")}</span>
        <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={cls} />
        <span className="mt-1 block text-xs text-muted-foreground">
          {t("auth.passwordHint")}
        </span>
      </label>
      <label className="block">
        <span className="text-sm font-medium">{t("auth.confirmNewPassword")}</span>
        <input required minLength={8} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={cls} />
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {done && <p className="text-sm text-muted-foreground">{t("auth.passwordUpdated")}</p>}
      <div className="flex flex-wrap gap-2">
        <button disabled={saving} className="btn-brand text-sm disabled:opacity-60">
          {saving ? t("auth.saving") : t("auth.updatePassword")}
        </button>
        {confirmRequired && (
          <button type="button" onClick={() => setOpen(false)} className="btn-outline-brand text-sm">
            {t("auth.cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
