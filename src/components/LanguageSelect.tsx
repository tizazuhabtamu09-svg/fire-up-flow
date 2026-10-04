import { useLanguage } from "@/lib/i18n";import { X } from "lucide-react";
import { LANGUAGES, OTHER_LANGUAGE, languageLabel } from "@/lib/languages";

const cls = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:border-primary";

/**
 * Multi-language picker: a dropdown adds languages (an employee can speak
 * several), selected ones show as removable chips. Picking "Other" reveals a
 * free-text field for a language that is not on the list.
 *
 * `value` is a comma-separated list of language keys so it still fits the
 * existing single `language` text column.
 */
export function LanguageSelect({
  value,
  other,
  onChange,
  onOtherChange,
  className,
  required







}: {value: string;other?: string;onChange: (v: string) => void;onOtherChange?: (v: string) => void;className?: string;required?: boolean;}) {const { t } = useLanguage();
  const selected = value.split(",").map((s) => s.trim()).filter(Boolean);

  function add(v: string) {
    if (!v || selected.includes(v)) return;
    onChange([...selected, v].join(","));
  }

  function remove(v: string) {
    const next = selected.filter((s) => s !== v);
    onChange(next.join(","));
    if (v === OTHER_LANGUAGE) onOtherChange?.("");
  }

  return (
    <div>
      <select
        value=""
        onChange={(e) => {
          add(e.target.value);
          e.target.value = "";
        }}
        className={className ?? cls}>
        
        <option value="">{selected.length ? "Add another language…" : "Select language"}</option>
        {LANGUAGES.filter((l) => !selected.includes(l.value)).map((l) =>
        <option key={l.value} value={l.value}>
            {l.label}
          </option>
        )}
      </select>

      {selected.length > 0 &&
      <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((s) =>
        <span key={s} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm font-medium">
              {languageLabel(s, s === OTHER_LANGUAGE ? other : null)}
              <button type="button" onClick={() => remove(s)} aria-label={`Remove ${languageLabel(s)}`}>
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </span>
        )}
        </div>
      }

      {selected.includes(OTHER_LANGUAGE) && onOtherChange &&
      <input
        value={other ?? ""}
        onChange={(e) => onOtherChange(e.target.value)}
        className={`${className ?? cls} mt-2`}
        placeholder={t("ui.write.your.language")}
        maxLength={60}
        required={required} />

      }
    </div>);

}
