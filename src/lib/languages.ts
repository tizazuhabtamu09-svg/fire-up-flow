/** Spoken languages offered on employee registration forms. */
export const LANGUAGES = [
  { value: "amharic", label: "Amharic", am: "አማርኛ" },
  { value: "english", label: "English", am: "እንግሊዝኛ" },
  { value: "afan_oromo", label: "Afan Oromo", am: "አፋን ኦሮሞ" },
  { value: "tigrinya", label: "Tigrinya", am: "ትግርኛ" },
  { value: "somali", label: "Somali", am: "ሶማልኛ" },
  { value: "other", label: "Other", am: "ሌላ" },
] as const;

export const OTHER_LANGUAGE = "other";

export const languageLabel = (v?: string | null, custom?: string | null): string => {
  if (!v) return "";
  // Supports comma-separated multi-language values.
  if (v.includes(",")) {
    return v
      .split(",")
      .map((s) => languageLabel(s.trim(), custom))
      .filter(Boolean)
      .join(", ");
  }
  if (v === OTHER_LANGUAGE) return custom?.trim() || "Other";
  return LANGUAGES.find((l) => l.value === v)?.label ?? v;
};
