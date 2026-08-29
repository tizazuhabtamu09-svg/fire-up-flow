import { useState } from "react";
import { type SectorType } from "@/lib/app-config";
import { SectorSelect } from "@/components/SectorSelect";
import { LanguageSelect } from "@/components/LanguageSelect";
import type { Database } from "@/integrations/supabase/types";
import { useLanguage } from "@/lib/i18n";

export type WorkerRow = Database["public"]["Tables"]["workers"]["Row"];

export type WorkerFormValues = {
  full_name: string;
  phone: string;
  sector: SectorType | "";
  sector_other: string;
  language: string;
  language_other: string;
  city: string;
  area: string;
  experience: string;
  gender: "" | "male" | "female" | "other";
  age: string;
  price: string;
  available: boolean;
};

export const emptyWorker: WorkerFormValues = {
  full_name: "",
  phone: "",
  sector: "",
  sector_other: "",
  language: "",
  language_other: "",
  city: "Addis Ababa",
  area: "",
  experience: "",
  gender: "",
  age: "",
  price: "",
  available: true,
};

export function toFormValues(w: WorkerRow): WorkerFormValues {
  return {
    full_name: w.full_name,
    phone: w.phone ?? "",
    sector: (w.sector ?? "") as WorkerFormValues["sector"],
    sector_other: w.sector_other ?? "",
    language: w.language ?? "",
    language_other: w.language_other ?? "",
    city: w.city ?? "",
    area: w.area ?? "",
    experience: w.experience ?? "",
    gender: (w.gender ?? "") as WorkerFormValues["gender"],
    age: w.age ? String(w.age) : "",
    price: w.price ? String(w.price) : "",
    available: w.available,
  };
}

const cls = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:border-primary";

export function WorkerForm({
  initial,
  submitLabel,
  onSubmit,
  note,
}: {
  initial: WorkerFormValues;
  submitLabel: string;
  note?: string;
  onSubmit: (values: WorkerFormValues) => Promise<string | null>;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof WorkerFormValues>(k: K, v: WorkerFormValues[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) return setError(t("auth.fullNameRequired"));
    if (!form.sector) return setError(t("auth.sectorRequired"));
    setSaving(true);
    setError(null);
    const err = await onSubmit(form);
    setSaving(false);
    if (err) setError(err);
  }

  return (
    <form onSubmit={handle} className="card-soft space-y-5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">{t("auth.fullName")}</span>
          <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className={cls} required maxLength={120} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t("auth.phone")}</span>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={cls} maxLength={30} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t("auth.sector")}</span>
          <SectorSelect
            required
            value={form.sector}
            other={form.sector_other}
            onChange={(v) => set("sector", v)}
            onOtherChange={(v) => set("sector_other", v)}
            className={cls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Language</span>
          <LanguageSelect
            value={form.language}
            other={form.language_other}
            onChange={(v) => set("language", v)}
            onOtherChange={(v) => set("language_other", v)}
            className={cls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t("auth.monthlyPrice")}</span>
          <input type="number" min={0} value={form.price} onChange={(e) => set("price", e.target.value)} className={cls} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t("auth.city")}</span>
          <input value={form.city} onChange={(e) => set("city", e.target.value)} className={cls} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t("auth.area")}</span>
          <input value={form.area} onChange={(e) => set("area", e.target.value)} className={cls} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t("auth.gender")}</span>
          <select value={form.gender} onChange={(e) => set("gender", e.target.value as WorkerFormValues["gender"])} className={cls}>
            <option value="">{t("auth.notSpecified")}</option>
            <option value="female">{t("auth.female")}</option>
            <option value="male">{t("auth.male")}</option>
            <option value="other">{t("auth.other")}</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">{t("auth.age")}</span>
          <input type="number" min={16} max={90} value={form.age} onChange={(e) => set("age", e.target.value)} className={cls} />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium">{t("auth.experience")}</span>
        <textarea rows={3} value={form.experience} onChange={(e) => set("experience", e.target.value)} className={cls} maxLength={800} />
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={form.available} onChange={(e) => set("available", e.target.checked)} />
        {t("auth.availableForWork")}
      </label>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button disabled={saving} className="btn-brand w-full disabled:opacity-60">{saving ? t("auth.saving") : submitLabel}</button>
    </form>
  );
}
