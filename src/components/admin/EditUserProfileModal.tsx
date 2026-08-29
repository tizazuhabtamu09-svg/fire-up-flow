import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { SectorSelect } from "@/components/SectorSelect";
import { LanguageSelect } from "@/components/LanguageSelect";
import { SkillsSelect } from "@/components/SkillsSelect";
import type { SectorType } from "@/lib/app-config";
import { adminUpdateWorkerProfile } from "@/lib/admin-profile.functions";
import type { WorkerRecord } from "@/lib/employee-profile";
import { uploadFile, signedUrl } from "@/lib/uploads";

const cls = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

/**
 * Admin-only editor for another user's registration record. Every field the
 * user filled during onboarding is pre-populated and editable.
 */
export function EditUserProfileModal({
  worker,
  onClose,
  onSaved,
}: {
  worker: WorkerRecord;
  onClose: () => void;
  onSaved: (updated: WorkerRecord) => void;
}) {
  const save = useServerFn(adminUpdateWorkerProfile);
  const [form, setForm] = useState({
    full_name: worker.full_name ?? "",
    phone: worker.phone ?? "",
    email: worker.email ?? "",
    gender: (worker.gender ?? "") as "" | "male" | "female" | "other",
    age: worker.age != null ? String(worker.age) : "",
    sector: (worker.sector ?? "") as SectorType | "",
    sector_other: worker.sector_other ?? "",
    experience: worker.experience ?? "",
    price: worker.price != null ? String(worker.price) : "",
    city: worker.city ?? "",
    sub_city: worker.sub_city ?? "",
    wereda: worker.wereda ?? "",
    kebele: worker.kebele ?? "",
    area: worker.area ?? "",
    address: worker.address ?? "",
    fayda_number: worker.fayda_number ?? "",
    guarantor_name: worker.guarantor_name ?? "",
    guarantor_phone: worker.guarantor_phone ?? "",
    guarantor_id_number: worker.guarantor_id_number ?? "",
    language: worker.language ?? "",
    language_other: worker.language_other ?? "",
    skills: (worker.skills ?? []) as string[],
    available: Boolean(worker.available),
    photo_url: worker.photo_url ?? "",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    let alive = true;
    if (form.photo_url) {
      signedUrl("avatars", form.photo_url).then((url) => alive && setPhotoPreview(url));
    } else {
      setPhotoPreview(null);
    }
    return () => {
      alive = false;
    };
  }, [form.photo_url]);

  async function pickPhoto(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const path = await uploadFile("avatars", worker.user_id ?? worker.id, "photo", file);
      set("photo_url", path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload the photo.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await save({
        data: {
          workerId: worker.id,
          values: {
            ...form,
            photo_url: form.photo_url || null,
            gender: form.gender || null,
            age: form.age ? Number(form.age) : null,
            price: form.price ? Number(form.price) : null,
          },
        },
      });
      onSaved(res.worker as WorkerRecord);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(/403|forbidden/i.test(message) ? "You do not have permission to edit this profile." : message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <form
        onSubmit={submit}
        className="my-8 w-full max-w-2xl rounded-2xl bg-card p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Edit profile</h2>
            <p className="text-xs text-muted-foreground">Admin edit of registration information.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-muted">
            {photoPreview && <img src={photoPreview} alt={form.full_name} className="h-full w-full object-cover" />}
          </div>
          <label className="text-sm">
            <span className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Profile photo
            </span>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)}
              className="mt-1 text-sm"
            />
            {uploading && <span className="text-xs text-muted-foreground">Uploading…</span>}
          </label>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input required value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className={cls} />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={cls} />
          </Field>
          <Field label="E-mail">
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={cls} />
          </Field>
          <Field label="Gender">
            <select value={form.gender} onChange={(e) => set("gender", e.target.value as typeof form.gender)} className={cls}>
              <option value="">Not disclosed</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Age">
            <input type="number" min={0} value={form.age} onChange={(e) => set("age", e.target.value)} className={cls} />
          </Field>
          <Field label="Expected rate (per month)">
            <input type="number" min={0} value={form.price} onChange={(e) => set("price", e.target.value)} className={cls} />
          </Field>
          <Field label="Sector">
            <SectorSelect
              value={form.sector}
              other={form.sector_other}
              onChange={(v) => set("sector", v)}
              onOtherChange={(v) => set("sector_other", v)}
              className={cls}
            />
          </Field>
          <Field label="Experience">
            <input value={form.experience} onChange={(e) => set("experience", e.target.value)} className={cls} />
          </Field>
          <Field label="City">
            <input value={form.city} onChange={(e) => set("city", e.target.value)} className={cls} />
          </Field>
          <Field label="Sub city">
            <input value={form.sub_city} onChange={(e) => set("sub_city", e.target.value)} className={cls} />
          </Field>
          <Field label="Wereda">
            <input value={form.wereda} onChange={(e) => set("wereda", e.target.value)} className={cls} />
          </Field>
          <Field label="Kebele">
            <input value={form.kebele} onChange={(e) => set("kebele", e.target.value)} className={cls} />
          </Field>
          <Field label="Area">
            <input value={form.area} onChange={(e) => set("area", e.target.value)} className={cls} />
          </Field>
          <Field label="Address">
            <input value={form.address} onChange={(e) => set("address", e.target.value)} className={cls} />
          </Field>
          <Field label="Fayda number">
            <input value={form.fayda_number} onChange={(e) => set("fayda_number", e.target.value)} className={cls} />
          </Field>
          <Field label="Guarantor name">
            <input value={form.guarantor_name} onChange={(e) => set("guarantor_name", e.target.value)} className={cls} />
          </Field>
          <Field label="Guarantor phone">
            <input value={form.guarantor_phone} onChange={(e) => set("guarantor_phone", e.target.value)} className={cls} />
          </Field>
          <Field label="Guarantor ID number">
            <input value={form.guarantor_id_number} onChange={(e) => set("guarantor_id_number", e.target.value)} className={cls} />
          </Field>
          <Field label="Language">
            <LanguageSelect
              value={form.language}
              other={form.language_other}
              onChange={(v) => set("language", v)}
              onOtherChange={(v) => set("language_other", v)}
              className={cls}
            />
          </Field>
          <Field label="Skills">
            <SkillsSelect value={form.skills} onChange={(v) => set("skills", v)} className={cls} />
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.available} onChange={(e) => set("available", e.target.checked)} />
            Available for work
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-outline-brand">Cancel</button>
          <button type="submit" disabled={saving} className="btn-brand disabled:opacity-60">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
