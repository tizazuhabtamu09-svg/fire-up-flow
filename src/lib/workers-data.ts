import { SECTORS } from "@/lib/app-config";

export type Worker = {
  id: string;
  avatar: string;
  name: string;
  role: string;
  am: string;
  rating: number;
  reviews: number;
  area: string;
  city: string;
  years: number;
  rate: number; // ETB per month
  available: boolean;
  gender: "female" | "male";
  languages: string[];
};

/** The single standardized sector list, shared with every sector dropdown. */
export const SERVICE_FILTERS = SECTORS.map((s) => s.label);

export const AREAS = [
  "Bole",
  "Kazanchis",
  "CMC",
  "Megenagna",
  "Piassa",
  "Sarbet",
  "Gerji",
] as const;
