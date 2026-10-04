import { useState } from "react";
import { X } from "lucide-react";
import { OTHER_SECTOR, SECTORS, sectorLabel } from "@/lib/app-config";
import { useCustomSectors } from "@/lib/sectors";
import { useLanguage } from "@/lib/i18n";

const cls = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:border-primary";

/**
 * Multi-select sector picker used for employee registration: an employee can
 * work in several sectors. Built-in sectors, admin-added sectors and free-text
 * "other" entries are all supported. Values are stored as plain strings —
 * built-in enum keys, or the typed label for custom/other sectors.
 */
export function SectorsSelect({
  value,
  onChange,
  className,
  required





}: {value: string[];onChange: (v: string[]) => void;className?: string;required?: boolean;}) {
  const { t } = useLanguage();
  const custom = useCustomSectors();
  const [freeText, setFreeText] = useState("");

  const add = (v: string) => {
    const next = v.trim();
    if (!next || value.includes(next)) return;
    onChange([...value, next]);
  };
  const remove = (v: string) => onChange(value.filter((s) => s !== v));

  const label = (v: string) =>
  SECTORS.find((s) => s.value === v)?.label ?? custom.find((c) => c.key === v)?.label ?? sectorLabel(v) ?? v;

  return (
    <div>
      <select
        value=""
        onChange={(e) => {
          if (e.target.value) add(e.target.value);
        }}
        className={className ?? cls}>
        
        <option value="">{t("auth.selectSector")}</option>
        {SECTORS.filter((s) => s.value !== OTHER_SECTOR && !value.includes(s.value)).map((s) =>
        <option key={s.value} value={s.value}>
            {s.label}
          </option>
        )}
        {custom.
        filter((c) => !value.includes(c.label)).
        map((c) =>
        <option key={c.key} value={c.label}>
              {c.label}
            </option>
        )}
      </select>

      <div className="mt-2 flex gap-2">
        <input
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(freeText);
              setFreeText("");
            }
          }}
          className={className ?? cls}
          placeholder={t("auth.writeYourSector")}
          maxLength={80} />
        
        <button
          type="button"
          onClick={() => {
            add(freeText);
            setFreeText("");
          }}
          className="btn-outline-brand mt-1 shrink-0 px-4 text-sm">{t("ui.add")}


        </button>
      </div>

      {value.length > 0 &&
      <div className="mt-2 flex flex-wrap gap-2">
          {value.map((s) =>
        <span key={s} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
              {label(s)}
              <button type="button" onClick={() => remove(s)} aria-label={`Remove ${label(s)}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
        )}
        </div>
      }
      {required && value.length === 0 &&
      <p className="mt-1 text-xs text-muted-foreground">{t("ui.select.at.least.one.sector")}</p>
      }
    </div>);

}
