import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";

type Props = {
  value: string;
  onChange: (city: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
};

const DEFAULT_CENTER: [number, number] = [9.0192, 38.7525]; // Addis Ababa

/** City text input with an optional OpenStreetMap picker that reverse-geocodes the chosen point. */
export function CityPicker({ value, onChange, label, required, className }: Props) {
  const { t } = useLanguage();
  const resolvedLabel = label ?? t("auth.city");
  const [open, setOpen] = useState(false);

  return (
    <div className="block">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {resolvedLabel}
          {required && <span className="text-destructive"> *</span>}
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {open ? t("auth.hideMap") : t("auth.pickOnMap")}
        </button>
      </div>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className ?? "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-primary"}
        placeholder={t("auth.cityPlaceholder")}
      />
      {open && <MapPicker onPick={onChange} />}
    </div>
  );
}

function MapPicker({ onPick }: { onPick: (city: string) => void }) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState(t("auth.clickMapForCity"));

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      // Leaflet CSS (loaded once, browser only)
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      if (cancelled || !ref.current) return;

      const map = L.map(ref.current).setView(DEFAULT_CENTER, 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      let marker: import("leaflet").Marker | null = null;

      map.on("click", async (e: import("leaflet").LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (marker) marker.setLatLng(e.latlng);
        else marker = L.marker(e.latlng).addTo(map);
        setStatus(t("auth.lookingUpPlace"));
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            { headers: { Accept: "application/json" } },
          );
          const json = (await res.json()) as { address?: Record<string, string>; display_name?: string };
          const a = json.address ?? {};
          const city = a["city"] ?? a["town"] ?? a["village"] ?? a["municipality"] ?? a["state"] ?? json.display_name?.split(",")[0];
          if (city) {
            onPick(city);
            setStatus(t("auth.citySelected", { city }));
          } else {
            setStatus(t("auth.couldntFindPlace"));
          }
        } catch {
          setStatus(t("auth.cityLookupFailed"));
        }
      });

      cleanup = () => map.remove();
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [onPick, t]);

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-input">
      <div ref={ref} className="h-56 w-full" />
      <p className="bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">{status}</p>
    </div>
  );
}
