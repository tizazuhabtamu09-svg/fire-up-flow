import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useProfile, roleLabels } from "@/lib/use-session";
import { JOB_STATUS_LABEL, type JobPost } from "@/lib/jobs";
import { ChangePassword } from "@/components/ChangePassword";
import { ChangeEmail } from "@/components/ChangeEmail";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { WalletBar } from "@/components/WalletBar";
import { uploadFile, signedUrl } from "@/lib/uploads";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My profile — Agaze/አጋዝ" },
      { name: "description", content: "Update your Agaze account details: name, phone, city and role." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

const cls = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:border-primary";

function ProfilePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useSession();
  const { profile, setProfile } = useProfile(user?.id);
  const [form, setForm] = useState({ full_name: "", phone: "", city: "" });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile?.avatar_url) {
      signedUrl("avatars", profile.avatar_url).then(setAvatar);
    } else {
      setAvatar(null);
    }
  }, [profile?.avatar_url]);

  async function onAvatar(file: File | null) {
    if (!file || !user) return;
    setUploading(true);
    setError(null);
    try {
      const path = await uploadFile("avatars", user.id, "profile", file);
      const { error: err } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
      if (err) throw err;
      if (profile) setProfile({ ...profile, avatar_url: path });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile.uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        city: profile.city ?? "",
      });
    }
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...form });
    if (error) setError(error.message);
    else setSaved(true);
    setSaving(false);
  }

  async function toggleAvailability() {
    if (!profile) return;
    const next = !profile.available;
    const { error: err } = await supabase.from("profiles").update({ available: next }).eq("id", profile.id);
    if (!err) setProfile({ ...profile, available: next });
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <WalletBar balance={profile?.wallet_balance} />
      <h1 className="text-3xl font-bold">{t("profile.title")}</h1>
      <p className="font-amharic text-muted-foreground">የእኔ መገለጫ</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
          {profile ? roleLabels[profile.role].en : t("profile.account")}
        </span>
        <VerifiedBadge status={profile?.verification_status} />
      </div>

      {profile?.role === "employee" && (
        <div className="card-soft mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="font-semibold">{t("profile.availability")}</p>
            <p className="text-sm text-muted-foreground">{t("profile.availabilityNote")}</p>
          </div>
          <button onClick={toggleAvailability} className="btn-outline-brand text-sm">
            {profile.available ? t("profile.available") : t("profile.notAvailable")}
          </button>
        </div>
      )}

      <div className="card-soft mt-6 flex flex-wrap items-center gap-5 p-5">
        <div className="h-20 w-20 overflow-hidden rounded-full bg-secondary">
          {avatar ? (
            <img src={avatar} alt={t("profile.profileAlt")} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">👤</div>
          )}
        </div>
        <div>
          <p className="font-semibold">{t("profile.profilePicture")}</p>
          <p className="text-sm text-muted-foreground">{t("profile.profilePictureNote")}</p>
          <label className="btn-outline-brand mt-3 inline-block cursor-pointer text-sm">
            {uploading ? t("profile.uploading") : avatar ? t("profile.changePhoto") : t("profile.uploadPhoto")}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onAvatar(e.target.files?.[0] ?? null)} />
          </label>
        </div>
      </div>


      <form onSubmit={save} className="card-soft mt-6 space-y-5 p-8">
        <label className="block">
          <span className="text-sm font-medium">{t("profile.email")}</span>
          <input disabled value={user?.email ?? ""} className={`${cls} opacity-70`} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t("profile.fullName")}</span>
          <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={cls} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">{t("profile.phone")}</span>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={cls} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">{t("profile.city")}</span>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={cls} />
          </label>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && <p className="text-sm text-muted-foreground">{t("profile.saved")}</p>}
        <button disabled={saving} className="btn-brand w-full disabled:opacity-60">{saving ? t("profile.saving") : t("profile.saveChanges")}</button>
      </form>

      <div className="mt-8">
        <h2 className="text-lg font-bold">{t("profile.accountSecurity")}</h2>
        <p className="mb-3 text-sm text-muted-foreground">{t("profile.accountSecurityNote")}</p>
        <div className="space-y-4">
          <ChangeEmail currentEmail={user?.email} />
          <ChangePassword />
        </div>
      </div>

      <button onClick={signOut} className="btn-outline-brand mt-6 w-full text-sm">{t("profile.signOut")}</button>
    </div>
  );
}
