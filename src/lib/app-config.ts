import type { Database } from "@/integrations/supabase/types";

export type SectorType = Database["public"]["Enums"]["sector_type"];

export const BRAND = {
  /** Primary brand name (English). Edit this to rebrand the whole app. */
  name: "Agaze",
  /** Amharic brand name. */
  amharic: "አጋዥ",
  /** Combined name used in titles and headers. */
  fullName: "Agaze/አጋዥ",
  /** Default tagline used in SEO and hero copy. */
  tagline: "Find trusted domestic workers near you",
  /** Default meta description. */
  description:
    "Verified cleaners, babysitters, cooks and waitstaff. Book same-day home services in your area.",
} as const;

export const SECTORS: { value: SectorType; label: string; am: string }[] = [
  { value: "house_maid", label: "House Maid", am: "የቤት ሰራተኛ" },
  { value: "baby_sitter", label: "Baby Sitter", am: "ልጅ ተንከባካቢ" },
  { value: "cleaner", label: "Cleaner", am: "አጽጂ" },
  { value: "waiter", label: "Waiter / Waitress", am: "አስተናጋጅ" },
  { value: "construction_worker", label: "Construction Worker", am: "የግንባታ ሰራተኛ" },
  { value: "paint_man", label: "Paint Man", am: "ቀለም ቀቢ" },
  { value: "plumber", label: "Plumber", am: "ቧንቧ ሰራተኛ" },
  { value: "electrician", label: "Electrician", am: "ኤሌክትሪሺያን" },
  { value: "barber", label: "Barber", am: "ፀጉር አስተካካይ" },
  { value: "makeup_artist", label: "Makeup Artist", am: "ሜካፕ አርቲስት" },
  { value: "driver", label: "Driver", am: "ሹፌር" },
  { value: "delivery_man", label: "Delivery Man", am: "አቅራቢ" },
  { value: "barista", label: "Barista", am: "ባሪስታ" },
  { value: "beauty_salon_worker_men", label: "Beauty Salon Worker (Men)", am: "የወንዶች ውበት ሳሎን ሰራተኛ" },
  { value: "beauty_salon_worker_women", label: "Beauty Salon Worker (Women)", am: "የሴቶች ውበት ሳሎን ሰራተኛ" },
  { value: "other", label: "Other (write yours)", am: "ሌላ (ይጻፉ)" },
];

export const OTHER_SECTOR = "other";

export const sectorLabel = (v: string | null | undefined, custom?: string | null) => {
  if (!v) return "";
  if (v === OTHER_SECTOR) return custom?.trim() || "Other";
  return SECTORS.find((s) => s.value === v)?.label ?? v.replace(/_/g, " ");
};

export const CONTACT = {
  phone: import.meta.env.VITE_CONTACT_PHONE ?? "+251924526186",
  phoneHref: `tel:${import.meta.env.VITE_CONTACT_PHONE ?? "+251924526186"}`,
  email: import.meta.env.VITE_CONTACT_EMAIL ?? "tizazuhabtamu64@gmail.com",
  accountName: import.meta.env.VITE_PAYMENT_ACCOUNT_NAME ?? "Tizazu Habtamu",
  telebirr: import.meta.env.VITE_TELEBIRR_NUMBER ?? "+251924526186",
};

/** Where severe compliance incidents are escalated (compliance officer / local agency). */
export const COMPLIANCE_EMAIL =
  import.meta.env.VITE_COMPLIANCE_EMAIL ?? import.meta.env.VITE_CONTACT_EMAIL ?? "tizazuhabtamu64@gmail.com";




/** Wallet charges, in ETB. */
export const FEES = {
  booking: 100,
  registerEmployee: 50,
  proFeature: 200,
} as const;

export const money = (n: number | null | undefined) =>
  `ETB ${Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
