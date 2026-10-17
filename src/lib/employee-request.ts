import { supabase } from "@/integrations/supabase/client";
import { sectorLabel } from "@/lib/app-config";
import { languageLabel } from "@/lib/languages";
import { resolveAvatars, yearsFromExperience } from "@/lib/employees";

/** What the public may see about a worker. Never contains phone, e-mail or documents. */
export type PublicEmployee = {
  id: string;
  name: string;
  role: string;
  sector: string;
  avatar: string;
  photoUrl: string | null;
  rating: number;
  reviews: number;
  years: number;
  experience: string | null;
  age: number | null;
  gender: string | null;
  city: string;
  area: string;
  rate: number;
  available: boolean;
  languages: string[];
  faydaVerified: boolean;
  guarantorVerified: boolean;
  education: string | null;
  educationInstitution: string | null;
  educationQualification: string | null;
  educationGraduationYear: number | null;
  sectors: string[];
  demo: boolean;
};

/** Loads a single registered worker for the public profile view. */
export async function loadPublicEmployee(id: string): Promise<PublicEmployee | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const { data } = isUuid
    ? await supabase.from("workers_public").select("*").eq("verification_status", "approved").eq("available", true).eq("id", id).maybeSingle()
    : { data: null };

  if (data) {
    const row = data as typeof data & {
      sector_other?: string | null;
      fayda_verified?: boolean | null;
      guarantor_verified?: boolean | null;
      language?: string | null;
      language_other?: string | null;
      sectors?: string[] | null;
      education?: string | null;
      education_institution?: string | null;
      education_qualification?: string | null;
      education_graduation_year?: number | null;
    };
    return {
      id: row.id ?? id,
      name: row.full_name ?? "Worker",
      role: sectorLabel(row.sector ?? "", row.sector_other ?? null),
      sector: row.sector ?? "other",
      avatar: row.gender === "male" ? "🧑🏾" : "👩🏾",
      photoUrl: row.photo_url ? ((await resolveAvatars([row.photo_url]))[row.photo_url] ?? null) : null,
      rating: 5,
      reviews: 0,
      years: yearsFromExperience(row.experience ?? null),
      experience: row.experience ?? null,
      age: row.age ?? null,
      gender: row.gender ?? null,
      city: row.city ?? "Addis Ababa",
      area: row.area ?? "",
      rate: Number(row.price ?? 0),
      available: Boolean(row.available),
      languages: row.language
        ? row.language.split(",").map((s) => languageLabel(s.trim(), row.language_other))
        : ["Amharic"],
      faydaVerified: Boolean(row.fayda_verified),
      guarantorVerified: Boolean(row.guarantor_verified),
      education: row.education ?? null,
      educationInstitution: row.education_institution ?? null,
      educationQualification: row.education_qualification ?? null,
      educationGraduationYear: row.education_graduation_year ?? null,
      sectors: (row.sectors ?? []).filter(Boolean),
      demo: false,
    };
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* Dynamic "Tell us about you" questions                               */
/* ------------------------------------------------------------------ */

export type RequestField = {
  name: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "toggle";
  options?: string[];
  required?: boolean;
  /** Only rendered when another field currently holds this value. */
  showIf?: { field: string; value: string };
};

export type SectorGroup =
  | "childcare"
  | "cleaning"
  | "elderly"
  | "cook"
  | "driver"
  | "security"
  | "gardening"
  | "maintenance"
  | "general";

const YES_NO = ["Yes", "No"];

export const SECTOR_QUESTIONS: Record<SectorGroup, RequestField[]> = {
  childcare: [
    { name: "kids_count", label: "Number of kids", type: "number", required: true },
    { name: "newborn", label: "Includes a newborn?", type: "toggle", options: YES_NO, required: true },
    { name: "kids_ages", label: "Age(s) of the child / children", type: "text", required: true },
    { name: "special_needs", label: "Special medical, dietary or developmental needs", type: "textarea" },
  ],
  cleaning: [
    { name: "property_type", label: "Type of property", type: "select", options: ["Apartment", "Villa", "Office", "Commercial space"], required: true },
    { name: "rooms", label: "Number of rooms", type: "number", required: true },
    { name: "bathrooms", label: "Number of bathrooms", type: "number" },
    { name: "size_sqm", label: "Approximate size (m²)", type: "number" },
    { name: "scope", label: "Cleaning scope", type: "select", options: ["Deep clean", "Regular maintenance", "Post-construction", "Laundry / ironing included"], required: true },
    { name: "supplies", label: "Supply preference", type: "select", options: ["Employer provides products", "Cleaner brings own supplies"], required: true },
  ],
  elderly: [
    { name: "care_level", label: "Level of care required", type: "select", options: ["Companionship", "Mobility assistance", "Full bedridden care", "Medication management"], required: true },
    { name: "conditions", label: "Medical conditions / mobility status", type: "textarea", required: true },
    { name: "shift", label: "Shift requirement", type: "select", options: ["Day shift", "Night shift", "24/7 live-in"], required: true },
  ],
  cook: [
    { name: "diet", label: "Dietary preferences / restrictions", type: "text", required: true },
    { name: "cuisine", label: "Preferred cuisine types", type: "select", options: ["Local traditional", "International", "Pastry / baking", "Mixed"], required: true },
    { name: "meal_frequency", label: "Meal frequency", type: "select", options: ["3 meals a day", "Weekly meal prep", "Event catering"], required: true },
    { name: "family_size", label: "Family size to cook for", type: "number", required: true },
  ],
  driver: [
    { name: "vehicle_type", label: "Vehicle type to be driven", type: "select", options: ["Manual", "Automatic", "SUV", "Luxury sedan", "Commercial truck"], required: true },
    { name: "vehicle_owner", label: "Vehicle ownership", type: "select", options: ["Employer provides vehicle", "Driver provides vehicle"], required: true },
    { name: "driving_scope", label: "Driving scope", type: "select", options: ["Daily commute", "School drop-offs", "Inter-city travel", "Logistics / delivery"], required: true },
  ],
  security: [
    { name: "property_type", label: "Property type", type: "select", options: ["Residential", "Business", "Construction site", "Event"], required: true },
    { name: "guard_schedule", label: "Guard schedule", type: "select", options: ["Night watch", "Day shift", "24/7 rotational"], required: true },
    { name: "requirements", label: "Specific requirements (uniform, armed/unarmed, dog handling)", type: "textarea" },
  ],
  gardening: [
    { name: "yard_size", label: "Yard / garden area", type: "text", required: true },
    { name: "scope", label: "Service scope", type: "select", options: ["Lawn mowing", "Tree trimming", "Landscaping redesign", "Ongoing plant maintenance"], required: true },
    { name: "tools", label: "Tools provision", type: "select", options: ["Employer has tools", "Gardener brings equipment"], required: true },
  ],
  maintenance: [
    { name: "issue", label: "Describe the issue or task list", type: "textarea", required: true },
    { name: "urgency", label: "Urgency level", type: "select", options: ["Emergency — same day", "Scheduled work"], required: true },
    { name: "materials", label: "Materials provision", type: "select", options: ["Materials ready on site", "Contractor sources parts"], required: true },
  ],
  general: [
    { name: "task_details", label: "What do you need done?", type: "textarea", required: true },
    { name: "household_size", label: "Household / team size", type: "number" },
    { name: "has_kids", label: "Do you have kids?", type: "toggle", options: YES_NO },
    { name: "kids_count", label: "Number of kids", type: "number", showIf: { field: "has_kids", value: "Yes" } },
  ],
};

/** Maps a sector value (or a human role label) onto a question set. */
export function sectorGroup(sector: string): SectorGroup {
  const s = sector.toLowerCase();
  if (s.includes("baby") || s.includes("child") || s.includes("nanny")) return "childcare";
  if (s.includes("clean") || s.includes("maid")) return "cleaning";
  if (s.includes("elder") || s.includes("nurs") || s.includes("care")) return "elderly";
  if (s.includes("cook") || s.includes("chef") || s.includes("barista") || s.includes("waiter")) return "cook";
  if (s.includes("driver") || s.includes("delivery") || s.includes("chauffeur")) return "driver";
  if (s.includes("security") || s.includes("guard")) return "security";
  if (s.includes("garden") || s.includes("landscap")) return "gardening";
  if (s.includes("plumb") || s.includes("electric") || s.includes("paint") || s.includes("construction") || s.includes("maintenance")) return "maintenance";
  return "general";
}

export const DURATIONS = [
  "Full-time",
  "Part-time",
  "One-time project",
  "Live-in",
  "Weekend only",
  "Specific date range",
];
