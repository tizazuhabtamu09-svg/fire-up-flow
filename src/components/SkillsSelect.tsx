import { useLanguage } from "@/lib/i18n";import { useState } from "react";
import { Plus, X } from "lucide-react";
import { SKILLS, skillLabel } from "@/lib/skills";

const cls = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:border-primary";

/**
 * Skills picker: a dropdown of known skills plus an "Add custom skill" input so
 * a worker can type any skill that is not on the list.
 */
export function SkillsSelect({
  value,
  onChange,
  className




}: {value: string[];onChange: (v: string[]) => void;className?: string;}) {const { t } = useLanguage();
  const [custom, setCustom] = useState("");
  const [adding, setAdding] = useState(false);

  function add(skill: string) {
    const s = skill.trim();
    if (!s || value.includes(s)) return;
    onChange([...value, s]);
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
        
        <option value="">{t("ui.select.a.skill")}</option>
        {SKILLS.filter((s) => !value.includes(s.value)).map((s) =>
        <option key={s.value} value={s.value}>
            {s.label}
          </option>
        )}
      </select>

      {value.length > 0 &&
      <div className="mt-2 flex flex-wrap gap-2">
          {value.map((s) =>
        <span key={s} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm font-medium">
              {skillLabel(s)}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== s))} aria-label={`Remove ${skillLabel(s)}`}>
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </span>
        )}
        </div>
      }

      {adding ?
      <div className="mt-2 flex gap-2">
          <input
          value={custom}
          maxLength={60}
          placeholder={t("ui.type.your.skill")}
          className={`${className ?? cls} mt-0`}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(custom);
              setCustom("");
            }
          }} />
        
          <button
          type="button"
          className="btn-brand whitespace-nowrap px-4"
          onClick={() => {
            add(custom);
            setCustom("");
          }}>{t("ui.add")}


        </button>
        </div> :

      <button
        type="button"
        onClick={() => setAdding(true)}
        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        
          <Plus className="h-4 w-4" />{t("ui.add.custom.skill")}
      </button>
      }
    </div>);

}
