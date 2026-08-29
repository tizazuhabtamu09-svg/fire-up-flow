import { OTHER_SECTOR, SECTORS, type SectorType } from "@/lib/app-config";
import { useCustomSectors } from "@/lib/sectors";
import { useLanguage } from "@/lib/i18n";

const cls = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:border-primary";

/**
 * The single sector dropdown used everywhere on the site. It renders the built-in
 * sector list, any sector an admin added from the admin panel, and an
 * "Other (write yours)" choice that reveals a free-text field.
 */
export function SectorSelect({
  value,
  other,
  onChange,
  onOtherChange,
  required,
  className,
  includeAll,
}: {
  value: SectorType | "";
  other?: string;
  onChange: (v: SectorType | "") => void;
  onOtherChange?: (v: string) => void;
  required?: boolean;
  className?: string;
  /** Render an "All sectors" empty option (filters). */
  includeAll?: boolean;
}) {
  const { t } = useLanguage();
  const custom = useCustomSectors();

  const trimmedOther = (other ?? "").trim();
  const matched =
    value === OTHER_SECTOR ? custom.find((c) => c.label.toLowerCase() === trimmedOther.toLowerCase()) : undefined;
  const selectValue = matched ? `custom:${matched.key}` : value;
  const showFreeText = value === OTHER_SECTOR && !matched;

  function handleChange(next: string) {
    if (next.startsWith("custom:")) {
      const found = custom.find((c) => c.key === next.slice("custom:".length));
      onChange(OTHER_SECTOR as SectorType);
      onOtherChange?.(found?.label ?? "");
      return;
    }
    onChange(next as SectorType | "");
    if (next !== OTHER_SECTOR) onOtherChange?.("");
  }

  return (
    <>
      <select
        required={required}
        value={selectValue}
        onChange={(e) => handleChange(e.target.value)}
        className={className ?? cls}
      >
        <option value="">{includeAll ? t("auth.allSectors") : t("auth.selectSector")}</option>
        {SECTORS.filter((s) => s.value !== OTHER_SECTOR).map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
        {custom.map((c) => (
          <option key={c.key} value={`custom:${c.key}`}>
            {c.label}
          </option>
        ))}
        <option value={OTHER_SECTOR}>
          {SECTORS.find((s) => s.value === OTHER_SECTOR)?.label ?? "Other (write yours)"}
        </option>
      </select>
      {showFreeText && onOtherChange && (
        <input
          value={other ?? ""}
          onChange={(e) => onOtherChange(e.target.value)}
          className={`${className ?? cls} mt-2`}
          placeholder={t("auth.writeYourSector")}
          maxLength={80}
          required={required}
        />
      )}
    </>
  );
}
