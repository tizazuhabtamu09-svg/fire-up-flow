import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en.json";
import am from "@/locales/am.json";
import om from "@/locales/om.json";
import ti from "@/locales/ti.json";
import enAuth from "@/locales/en.auth.json";
import amAuth from "@/locales/am.auth.json";
import omAuth from "@/locales/om.auth.json";
import tiAuth from "@/locales/ti.auth.json";
import enApp from "@/locales/en.app.json";
import amApp from "@/locales/am.app.json";
import omApp from "@/locales/om.app.json";
import tiApp from "@/locales/ti.app.json";
import enAdmin from "@/locales/en.admin.json";
import amAdmin from "@/locales/am.admin.json";
import omAdmin from "@/locales/om.admin.json";
import tiAdmin from "@/locales/ti.admin.json";

export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "am", label: "Amharic", native: "አማርኛ" },
  { code: "om", label: "Afan Oromo", native: "Afaan Oromoo" },
  { code: "ti", label: "Tigrinya", native: "ትግርኛ" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

export const STORAGE_KEY = "agaze.lang";

/** Core keys plus per-area namespace files, merged into one flat dictionary. */
export const resources = {
  en: { translation: { ...en, ...enAuth, ...enApp, ...enAdmin } },
  am: { translation: { ...am, ...amAuth, ...amApp, ...amAdmin } },
  om: { translation: { ...om, ...omAuth, ...omApp, ...omAdmin } },
  ti: { translation: { ...ti, ...tiAuth, ...tiApp, ...tiAdmin } },
};

const SUPPORTED = LANGUAGES.map((l) => l.code) as readonly string[];

/** Languages written right-to-left. Adding e.g. "ar" here mirrors the layout. */
const RTL_LANGS = new Set<string>(["ar", "he", "fa", "ur"]);

export function isRtl(lang: string) {
  return RTL_LANGS.has(lang);
}

/** Maps a browser locale such as "am-ET" or "en-GB" onto a supported language. */
export function detectBrowserLang(): LangCode {
  if (typeof navigator === "undefined") return "en";
  const candidates = [navigator.language, ...(navigator.languages ?? [])];
  for (const raw of candidates) {
    const base = String(raw || "")
      .toLowerCase()
      .split("-")[0];
    if (base && SUPPORTED.includes(base)) return base as LangCode;
  }
  return "en";
}

export function storedLang(): LangCode | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v && SUPPORTED.includes(v) ? (v as LangCode) : null;
  } catch {
    return null;
  }
}

/**
 * Single i18next instance for the whole app. Keys are flat ("nav.login"), so
 * key/namespace separators are disabled and `{count}` style placeholders are
 * used for interpolation.
 */
if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: "en", // resolved on the client after hydration
    fallbackLng: "en",
    supportedLngs: SUPPORTED as string[],
    keySeparator: false,
    nsSeparator: false,
    interpolation: {
      escapeValue: false,
      prefix: "{",
      suffix: "}",
    },
    react: { useSuspense: false },
  });
}

export function applyDocumentLang(l: string) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = l;
  document.documentElement.dir = isRtl(l) ? "rtl" : "ltr";
}

/** Switches language, persists it and mirrors layout direction. */
export function changeLanguage(l: LangCode) {
  void i18n.changeLanguage(l);
  try {
    window.localStorage.setItem(STORAGE_KEY, l);
  } catch {
    /* storage unavailable */
  }
  applyDocumentLang(l);
}

export default i18n;
