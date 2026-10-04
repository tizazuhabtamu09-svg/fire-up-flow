import { useState } from "react";
import { SECTORS, type SectorType } from "@/lib/app-config";
import { SectorSelect } from "@/components/SectorSelect";
import { SectorsSelect } from "@/components/SectorsSelect";
import { LanguageSelect } from "@/components/LanguageSelect";
import { SkillsSelect } from "@/components/SkillsSelect";
import { FileUpload } from "@/components/FileUpload";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { LocationPicker, type LatLng } from "@/components/LocationPicker";
import { useLanguage } from "@/lib/i18n";

export type RegistrationVariant = "employee" | "employer" | "broker";

export type RegistrationValues = {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  sub_city: string;
  wereda: string;
  kebele: string;
  fayda_number: string;
  experience: string;
  /** Free-text education details (optional, inside the education section). */
  education: string;
  /** Conditional education section: hidden until toggled on. */
  has_education: boolean;
  education_institution: string;
  education_qualification: string;
  education_graduation_year: string;
  gender: "" | "male" | "female" | "other";
  age: string;
  sector: SectorType | "";
  sector_other: string;
  /** Employees may work in several sectors. Values are enum keys or free text. */
  sectors: string[];
  language: string;
  language_other: string;
  skills: string[];
  price: string;
  available: boolean;
  guarantor_name: string;
  guarantor_phone: string;
  guarantor_id_number: string;
  latitude: number | null;
  longitude: number | null;
};

export type RegistrationFiles = {
  photo: File | null;
  idFront: File | null;
  idBack: File | null;
  contract: File | null;
  /** Guarantor's Fayda ID photo (employee registration only). */
  guarantorId?: File | null;
  /** Guarantor's personal photo (employee registration only). */
  guarantorPhoto?: File | null;
  /** Certificate/diploma upload for the education section (PDF or image, max 10 MB). */
  educationDoc?: File | null;
};

const QUALIFICATIONS = [
"High School",
"Certificate",
"Diploma",
"Bachelor's Degree",
"Master's Degree",
"PhD",
"Other"];


/** Education document uploads are capped at 10 MB. */
const EDUCATION_DOC_MAX_BYTES = 10 * 1024 * 1024;

export const emptyRegistration: RegistrationValues = {
  full_name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  sub_city: "",
  wereda: "",
  kebele: "",
  fayda_number: "",
  experience: "",
  education: "",
  has_education: false,
  education_institution: "",
  education_qualification: "",
  education_graduation_year: "",
  gender: "",
  age: "",
  sector: "",
  sector_other: "",
  sectors: [],
  language: "",
  language_other: "",
  skills: [],
  price: "",
  available: true,
  guarantor_name: "",
  guarantor_phone: "",
  guarantor_id_number: "",
  latitude: null,
  longitude: null
};

const ENUM_SECTORS = new Set(SECTORS.map((s) => s.value as string));

/**
 * Keeps the single-value `sector` column in step with the multi-select list:
 * the first built-in sector becomes the primary one, otherwise the first
 * free-text/custom entry is stored as "other".
 */
export function withDerivedSector(form: RegistrationValues): RegistrationValues {
  if (form.sectors.length === 0) return form;
  const builtIn = form.sectors.find((s) => ENUM_SECTORS.has(s) && s !== "other");
  if (builtIn) return { ...form, sector: builtIn as SectorType };
  return { ...form, sector: "other" as SectorType, sector_other: form.sector_other || form.sectors[0] };
}

const cls = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:border-primary";

/**
 * One registration form shared by every entry point: public sign-up (employee /
 * employer / broker) and the in-app flows where a broker registers an employee
 * or an employer on their behalf.
 */
export function RegistrationForm({
  variant,
  initial = emptyRegistration,
  submitLabel,
  note,
  showPrice = false,
  showAvailability = false,
  onSubmit








}: {variant: RegistrationVariant;initial?: RegistrationValues;submitLabel: string;note?: string;showPrice?: boolean;showAvailability?: boolean;onSubmit: (values: RegistrationValues, files: RegistrationFiles) => Promise<string | null>;}) {
  const { t } = useLanguage();
  // Merge with defaults so older saved drafts (missing newer fields) stay controlled.
  const [form, setForm] = useState<RegistrationValues>({ ...emptyRegistration, ...initial });
  const [files, setFiles] = useState<RegistrationFiles>({ photo: null, idFront: null, idBack: null, contract: null, guarantorId: null, guarantorPhoto: null, educationDoc: null });
  const [showGuarantor, setShowGuarantor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmployee = variant === "employee";
  const needsId = variant !== "employer";

  function set<K extends keyof RegistrationValues>(k: K, v: RegistrationValues[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function setFile<K extends keyof RegistrationFiles>(k: K, v: File | null) {
    setFiles((f) => ({ ...f, [k]: v }));
  }

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.full_name.trim()) return setError(t("auth.fullNameRequired"));
    if (isEmployee && form.sectors.length === 0) return setError(t("auth.sectorRequired"));
    if (needsId && !form.fayda_number.trim()) return setError(t("auth.faydaRequired"));
    if (isEmployee && form.has_education) {
      if (!form.education_institution.trim()) {
        return setError("Please enter the institution name — or turn off the education section.");
      }
      if (!form.education_qualification) return setError("Please choose a qualification type.");
      const year = Number(form.education_graduation_year);
      if (!Number.isInteger(year) || year < 1950 || year > new Date().getFullYear()) {
        return setError("Enter a valid year of graduation.");
      }
      const doc = files.educationDoc;
      if (doc && doc.size > EDUCATION_DOC_MAX_BYTES) {
        return setError("The education document must be 10 MB or smaller.");
      }
    }
    setSaving(true);
    const err = await onSubmit(isEmployee ? withDerivedSector(form) : form, files);
    setSaving(false);
    if (err) setError(err);
  }

  return (
    <form onSubmit={handle} className="card-soft space-y-5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("auth.fullName")} required>
          <input required maxLength={120} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className={cls} />
        </Field>
        <Field label={t("auth.email")}>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={cls} />
        </Field>
        <Field label={t("auth.phone")}>
          <input maxLength={30} value={form.phone} onChange={(e) => set("phone", e.target.value)} className={cls} />
        </Field>
        <Field label={t("auth.address")}>
          <input value={form.address} onChange={(e) => set("address", e.target.value)} className={cls} placeholder={t("auth.addressPlaceholder")} />
        </Field>
      </div>

      <Field label={t("auth.profilePicture")}>
        <FileUpload file={files.photo} onFile={(f) => setFile("photo", f)} label={t("auth.uploadPhoto")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <AddressAutocomplete
          value={form.city}
          onChange={(c) => set("city", c)}
          onPick={(p) => setForm((f) => ({ ...f, city: p.city, latitude: p.latitude, longitude: p.longitude }))}
          className={cls} />
        
        <Field label={t("auth.subCity")}>
          <input value={form.sub_city} onChange={(e) => set("sub_city", e.target.value)} className={cls} />
        </Field>
        <Field label={t("auth.wereda")}>
          <input value={form.wereda} onChange={(e) => set("wereda", e.target.value)} className={cls} />
        </Field>
        <Field label={t("auth.kebele")}>
          <input value={form.kebele} onChange={(e) => set("kebele", e.target.value)} className={cls} />
        </Field>
      </div>

      <LocationPicker
        value={{ latitude: form.latitude, longitude: form.longitude }}
        onChange={(v: LatLng) => setForm((f) => ({ ...f, latitude: v.latitude, longitude: v.longitude }))}
        onPlaceName={(name) => setForm((f) => f.city ? f : { ...f, city: name })} />
      

      <Field label={t("auth.faydaIdNumber")} required={needsId}>
        <input required={needsId} value={form.fayda_number} onChange={(e) => set("fayda_number", e.target.value)} className={cls} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("auth.faydaFront")}>
          <FileUpload file={files.idFront} onFile={(f) => setFile("idFront", f)} />
        </Field>
        <Field label={t("auth.faydaBack")}>
          <FileUpload file={files.idBack} onFile={(f) => setFile("idBack", f)} />
        </Field>
      </div>


      {isEmployee &&
      <>
          <Field label={`${t("auth.sector")} (choose one or more)`} required>
            <SectorsSelect required value={form.sectors} onChange={(v) => set("sectors", v)} className={cls} />
          </Field>
          <Field label="Language">
            <LanguageSelect
            value={form.language}
            other={form.language_other}
            onChange={(v) => set("language", v)}
            onOtherChange={(v) => set("language_other", v)}
            className={cls} />
          
          </Field>
          <Field label="Skills">
            <SkillsSelect value={form.skills} onChange={(v) => set("skills", v)} className={cls} />
          </Field>
          <Field label={t("auth.experience")}>
            <textarea rows={3} maxLength={800} value={form.experience} onChange={(e) => set("experience", e.target.value)} className={cls} placeholder={t("auth.experiencePlaceholder")} />
          </Field>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
            type="checkbox"
            checked={form.has_education}
            onChange={(e) => set("has_education", e.target.checked)} />{t("ui.add.educational.background")}


        </label>
          {form.has_education &&
        <fieldset className="rounded-xl border border-border p-4">
              <legend className="px-2 text-sm font-semibold">{t("ui.educational.background")}</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Institution name" required>
                  <input
                maxLength={200}
                value={form.education_institution}
                onChange={(e) => set("education_institution", e.target.value)}
                className={cls}
                placeholder={t("ui.e.g.addis.ababa.university")} />
              
                </Field>
                <Field label="Qualification type" required>
                  <select
                value={form.education_qualification}
                onChange={(e) => set("education_qualification", e.target.value)}
                className={cls}>
                
                    <option value="">{t("ui.select")}</option>
                    {QUALIFICATIONS.map((q) =>
                <option key={q}>{q}</option>
                )}
                  </select>
                </Field>
                <Field label="Year of graduation" required>
                  <input
                type="number"
                min={1950}
                max={new Date().getFullYear()}
                value={form.education_graduation_year}
                onChange={(e) => set("education_graduation_year", e.target.value)}
                className={cls}
                placeholder={t("ui.e.g.2019")} />
              
                </Field>
                <Field label="Education document (PDF or image, max 10 MB)">
                  <FileUpload
                file={files.educationDoc ?? null}
                onFile={(f) => setFile("educationDoc", f)}
                accept=".pdf,image/*"
                label="Upload certificate / diploma" />
              
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Additional details (optional)">
                  <textarea
                rows={3}
                maxLength={800}
                value={form.education}
                onChange={(e) => set("education", e.target.value)}
                className={cls}
                placeholder={t("ui.e.g.grade.10.completed.tvet.certificate.in.cooking.any")} />
              
                </Field>
              </div>
            </fieldset>
        }
        </>
      }

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("auth.gender")}>
          <select value={form.gender} onChange={(e) => set("gender", e.target.value as RegistrationValues["gender"])} className={cls}>
            <option value="">{t("auth.notSpecified")}</option>
            <option value="female">{t("auth.female")}</option>
            <option value="male">{t("auth.male")}</option>
            <option value="other">{t("auth.other")}</option>
          </select>
        </Field>
        <Field label={t("auth.age")}>
          <input type="number" min={16} max={100} value={form.age} onChange={(e) => set("age", e.target.value)} className={cls} />
        </Field>
        {showPrice &&
        <Field label={t("auth.monthlyPrice")}>
            <input type="number" min={0} value={form.price} onChange={(e) => set("price", e.target.value)} className={cls} />
          </Field>
        }
      </div>

      {isEmployee &&
      <div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={showGuarantor} onChange={(e) => setShowGuarantor(e.target.checked)} />
            {t("auth.addGuarantorDetails")}
          </label>
          {showGuarantor &&
        <fieldset className="mt-3 rounded-xl border border-border p-4">
          <legend className="px-2 text-sm font-semibold">{t("auth.guarantorDetails")}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("auth.guarantorFullName")}>
              <input value={form.guarantor_name} onChange={(e) => set("guarantor_name", e.target.value)} className={cls} />
            </Field>
            <Field label={t("auth.guarantorPhone")}>
              <input value={form.guarantor_phone} onChange={(e) => set("guarantor_phone", e.target.value)} className={cls} />
            </Field>
            <Field label={t("auth.guarantorIdNumber")}>
              <input value={form.guarantor_id_number} onChange={(e) => set("guarantor_id_number", e.target.value)} className={cls} />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={t("auth.guarantorFaydaPhoto")}>
              <FileUpload file={files.guarantorId ?? null} onFile={(f) => setFile("guarantorId", f)} label={t("auth.uploadGuarantorId")} />
            </Field>
            <Field label={t("auth.guarantorPhoto")}>
              <FileUpload file={files.guarantorPhoto ?? null} onFile={(f) => setFile("guarantorPhoto", f)} label={t("auth.uploadGuarantorPhoto")} />
            </Field>
          </div>
        </fieldset>
        }
        </div>
      }

      {showAvailability &&
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={form.available} onChange={(e) => set("available", e.target.checked)} />
          {t("auth.availableForWork")}
        </label>
      }

      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button disabled={saving} className="btn-brand w-full disabled:opacity-60">
        {saving ? t("auth.saving") : submitLabel}
      </button>
    </form>);

}

function Field({ label, required, children }: {label: string;required?: boolean;children: React.ReactNode;}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      {children}
    </label>);

}
