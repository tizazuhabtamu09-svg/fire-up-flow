import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";

export type LatLng = { latitude: number | null; longitude: number | null };

const DEFAULT_CENTER: [number, number] = [9.0192, 38.7525]; // Addis Ababa

/**
 * Optional "pick exact location" control.
 * Collapsed by default — the user opens it only if they want to drop a precise pin.
 */
export function LocationPicker({
  value,
  onChange,
  onPlaceName,
  label,
}: {
  value: LatLng;
  onChange: (v: LatLng) => void;
  onPlaceName?: (name: string) => void;
  label?: string;
}) {
  const { t } = useLanguage();
  const resolvedLabel = label ?? t("auth.exactLocationOptional");
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);

  function useMyLocation() {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
        setOpen(true);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const has = value.latitude != null && value.longitude != null;

  return (
    <div className="rounded-xl border border-dashed border-input p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{resolvedLabel}</p>
          <p className="text-xs text-muted-foreground">
            {has
              ? t("auth.pinnedAt", { lat: value.latitude!.toFixed(5), lng: value.longitude!.toFixed(5) })
              : t("auth.locationSkipHint")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={useMyLocation} disabled={locating} className="btn-outline-brand text-xs disabled:opacity-60">
            {locating ? t("auth.locating") : t("auth.useMyLocation")}
          </button>
          <button type="button" onClick={() => setOpen((o) => !o)} className="btn-outline-brand text-xs">
            {open ? t("auth.hideMap") : t("auth.pickExactLocation")}
          </button>
          {has && (
            <button
              type="button"
              onClick={() => onChange({ latitude: null, longitude: null })}
              className="text-xs font-semibold text-destructive hover:underline"
            >
              {t("auth.clear")}
            </button>
          )}
        </div>
      </div>
      {open && <PinMap value={value} onChange={onChange} onPlaceName={onPlaceName} />}
    </div>
  );
}

function PinMap({
  value,
  onChange,
  onPlaceName,
}: {
  value: LatLng;
  onChange: (v: LatLng) => void;
  onPlaceName?: (name: string) => void;
}) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState(t("auth.tapMapToPin"));

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      if (cancelled || !ref.current) return;

      const start: [number, number] =
        value.latitude != null && value.longitude != null ? [value.latitude, value.longitude] : DEFAULT_CENTER;
      const map = L.map(ref.current).setView(start, value.latitude != null ? 15 : 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      let marker: import("leaflet").Marker | null =
        value.latitude != null && value.longitude != null ? L.marker(start).addTo(map) : null;

      map.on("click", async (e: import("leaflet").LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (marker) marker.setLatLng(e.latlng);
        else marker = L.marker(e.latlng).addTo(map);
        onChange({ latitude: lat, longitude: lng });
        setStatus(t("auth.pinnedAt", { lat: lat.toFixed(5), lng: lng.toFixed(5) }));
        if (!onPlaceName) return;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
            headers: { Accept: "application/json" },
          });
          const json = (await res.json()) as { address?: Record<string, string>; display_name?: string };
          const a = json.address ?? {};
          const city = a["city"] ?? a["town"] ?? a["village"] ?? a["municipality"] ?? a["state"];
          if (city) onPlaceName(city);
        } catch {
          /* place name is a nicety — the pin already saved */
        }
      });

      cleanup = () => map.remove();
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-input">
      <div ref={ref} className="h-56 w-full" />
      <p className="bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">{status}</p>
    </div>
  );
}
