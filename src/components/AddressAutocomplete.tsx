import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";

export type PickedAddress = {
  city: string;
  latitude: number;
  longitude: number;
  label: string;
};

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    county?: string;
    state?: string;
  };
};

/**
 * City/area search box backed by OpenStreetMap (Nominatim). Typing shows
 * matching places; picking one fills the city name and reports its latitude /
 * longitude so the record is ready for "near me" geospatial queries. Free
 * text still works when no suggestion matches.
 */
export function AddressAutocomplete({
  value,
  onChange,
  onPick,
  className,
  label,
  placeholder,
}: {
  value: string;
  onChange: (city: string) => void;
  onPick?: (picked: PickedAddress) => void;
  className?: string;
  label?: string;
  placeholder?: string;
}) {
  const { t } = useLanguage();
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // A programmatic value change (after picking a suggestion) must not trigger
  // another search round-trip.
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=et&limit=6&q=${encodeURIComponent(q)}`,
          { signal: ctrl.signal, headers: { Accept: "application/json" } },
        );
        if (!res.ok) return;
        const data = (await res.json()) as NominatimResult[];
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        // Aborted request or offline — keep the form usable.
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [value]);

  function pick(r: NominatimResult) {
    const a = r.address ?? {};
    const city =
      a.city ?? a.town ?? a.village ?? a.suburb ?? a.county ?? a.state ?? r.display_name.split(",")[0].trim();
    skipNextSearch.current = true;
    onChange(city);
    onPick?.({ city, latitude: Number(r.lat), longitude: Number(r.lon), label: r.display_name });
    setResults([]);
    setOpen(false);
  }

  return (
    <label className="relative block">
      <span className="text-sm font-medium">{label ?? t("auth.city")}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={className}
        placeholder={placeholder ?? t("auth.cityPlaceholder")}
        autoComplete="off"
        maxLength={120}
      />
      {searching && <span className="absolute right-3 top-9 text-xs text-muted-foreground">…</span>}
      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-card shadow-lg">
          {results.map((r, i) => (
            <li key={`${r.lat}-${r.lon}-${i}`}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(r);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary"
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <span className="mt-1 block text-[10px] text-muted-foreground">{t("auth.addressSearchCredit")}</span>
    </label>
  );
}
