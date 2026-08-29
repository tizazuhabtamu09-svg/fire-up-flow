import { useCallback, useEffect, type ReactNode } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";

import i18n, {
  LANGUAGES,
  applyDocumentLang,
  changeLanguage,
  detectBrowserLang,
  isRtl,
  storedLang,
  type LangCode,
} from "./i18n-config";

export { LANGUAGES, isRtl, detectBrowserLang };
export type { LangCode };

type Vars = Record<string, string | number>;

/**
 * App-wide i18n provider. Language resolves after hydration (stored preference
 * first, browser locale second) so SSR markup stays stable.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const next = storedLang() ?? detectBrowserLang();
    if (next !== i18n.language) void i18n.changeLanguage(next);
    applyDocumentLang(next);
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

/**
 * Primary translation hook. Returns the active language, text direction, a
 * setter that instantly re-renders every subscriber, and `t(key, vars)`.
 */
export function useLanguage() {
  const { t: translate, i18n: instance } = useTranslation();
  const lang = (instance.resolvedLanguage ?? instance.language ?? "en") as LangCode;

  const t = useCallback(
    (key: string, vars?: Vars) => String(translate(key, vars as never) ?? key),
    [translate],
  );

  const setLang = useCallback((l: LangCode) => changeLanguage(l), []);

  return { lang, dir: isRtl(lang) ? ("rtl" as const) : ("ltr" as const), setLang, t };
}

/**
 * Translator for components rendered outside <LanguageProvider> (root error and
 * not-found boundaries). Uses the shared instance directly.
 */
export function useStandaloneTranslation() {
  useEffect(() => {
    const next = storedLang() ?? detectBrowserLang();
    if (next !== i18n.language) void i18n.changeLanguage(next);
  }, []);
  const { t } = useLanguage();
  return t;
}
