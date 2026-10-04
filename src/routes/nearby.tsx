import { useLanguage } from "@/lib/i18n";import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sectorLabel, money } from "@/lib/app-config";
import { SectorSelect } from "@/components/SectorSelect";
import type { SectorType } from "@/lib/app-config";
import type { Database } from "@/integrations/supabase/types";
import { EmployeeAvatar } from "@/components/EmployeeAvatar";
import { resolveAvatars } from "@/lib/employees";

type WorkerRow = Database["public"]["Views"]["workers_public"]["Row"];

export const Route = createFileRoute("/nearby")({
  head: () => ({
    meta: [
    { title: "Employees Around You — Agaze/አጋዝ" },
    { name: "description", content: "See verified workers on a live map and find the nearest employee to your exact location in Addis Ababa." },
    { property: "og:title", content: "Employees Around You — Agaze/አጋዝ" },
    { property: "og:description", content: "Find the nearest verified worker to you on a live map." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" }]

  }),
  component: NearbyPage
});

const DEFAULT_CENTER: [number, number] = [9.0192, 38.7525];

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = (bLat - aLat) * Math.PI / 180;
  const dLng = (bLng - aLng) * Math.PI / 180;
  const s =
  Math.sin(dLat / 2) ** 2 +
  Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function NearbyPage() {const { t } = useLanguage();
  const [origin, setOrigin] = useState<{lat: number;lng: number;} | null>(null);
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [sector, setSector] = useState("");
  const [radius, setRadius] = useState(10);
  const [status, setStatus] = useState("Share your location or tap the map to set your spot.");
  const [photos, setPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.
    from("workers_public").
    select("*").
    eq("available", true).
    not("latitude", "is", null).
    not("longitude", "is", null).
    then(async ({ data }) => {
      const rows = data ?? [];
      setWorkers(rows);
      setPhotos(await resolveAvatars(rows.map((r) => r.photo_url)));
    });
  }, []);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) return setStatus("Your browser can't share location — tap the map instead.");
    setStatus("Getting your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("Showing employees around you.");
      },
      () => setStatus("Location blocked — tap the map to set your spot instead."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  const results = useMemo(() => {
    const list = workers.
    filter((w) => !sector || w.sector === sector).
    map((w) => ({
      worker: w,
      km: origin ? distanceKm(origin.lat, origin.lng, w.latitude!, w.longitude!) : null
    }));
    if (!origin) return list;
    return list.filter((r) => (r.km ?? 0) <= radius).sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
  }, [workers, sector, origin, radius]);

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold">{t("ui.employees.around.you")}</h1>
      <p className="font-amharic text-muted-foreground">በአካባቢዎ ያሉ ሰራተኞች</p>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("ui.workers.who.pinned.their.exact.location.appear.on.the")}


      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button onClick={locate} className="btn-brand text-sm">{t("ui.use.my.location")}</button>
        <SectorSelect
          includeAll
          value={sector as SectorType | ""}
          onChange={(v) => setSector(v)}
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        
        <label className="flex items-center gap-2 text-sm text-muted-foreground">{t("ui.within")}
          {radius}{t("ui.km")}
          <input type="range" min={1} max={50} value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
        </label>
        <Link to="/workers" className="btn-outline-brand text-sm">{t("ui.browse.all.workers")}</Link>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">{status}</p>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <NearbyMap
          origin={origin}
          onPick={(lat, lng) => {
            setOrigin({ lat, lng });
            setStatus("Showing employees around your picked spot.");
          }}
          points={results.map((r) => ({
            id: r.worker.id ?? "",
            lat: r.worker.latitude!,
            lng: r.worker.longitude!,
            title: `${r.worker.full_name} — ${sectorLabel(r.worker.sector ?? "")}`
          }))} />
        

        <div className="space-y-3">
          {results.length === 0 &&
          <p className="text-sm text-muted-foreground">{t("ui.no.employees.pinned.within.this.radius.yet.widen.the.r")}

          </p>
          }
          {results.map(({ worker, km }) =>
          <div key={worker.id} className="card-soft flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <EmployeeAvatar
                photoUrl={worker.photo_url ? photos[worker.photo_url] ?? null : null}
                name={worker.full_name ?? "Employee"}
                className="h-11 w-11 rounded-2xl" />
              
                <div>
                  <p className="font-semibold">{worker.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {sectorLabel(worker.sector ?? "")}
                    {worker.city ? ` · ${worker.city}` : ""}
                    {worker.price ? ` · ${money(Number(worker.price))}` : ""}
                  </p>
                </div>
              </div>
              {km != null &&
            <span className="whitespace-nowrap rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                  {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}
                </span>
            }
            </div>
          )}
        </div>
      </div>
    </div>);

}

type Point = {id: string;lat: number;lng: number;title: string;};

function NearbyMap({
  origin,
  points,
  onPick




}: {origin: {lat: number;lng: number;} | null;points: Point[];onPick: (lat: number, lng: number) => void;}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const originRef = useRef<import("leaflet").Marker | null>(null);
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => {
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
      if (cancelled || !ref.current || mapRef.current) return;
      const map = L.map(ref.current).setView(DEFAULT_CENTER, 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19
      }).addTo(map);
      map.on("click", (e: import("leaflet").LeafletMouseEvent) => onPick(e.latlng.lat, e.latlng.lng));
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setLeaflet(L);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const L = leaflet;
    const layer = layerRef.current;
    if (!L || !layer) return;
    layer.clearLayers();
    for (const p of points) {
      L.marker([p.lat, p.lng]).bindPopup(p.title).addTo(layer);
    }
  }, [leaflet, points]);

  useEffect(() => {
    const L = leaflet;
    const map = mapRef.current;
    if (!L || !map || !origin) return;
    if (originRef.current) originRef.current.setLatLng([origin.lat, origin.lng]);else

    originRef.current = L.circleMarker([origin.lat, origin.lng], {
      radius: 9,
      color: "#2563eb",
      fillColor: "#2563eb",
      fillOpacity: 0.7
    }).addTo(map) as unknown as import("leaflet").Marker;
    map.setView([origin.lat, origin.lng], 13);
  }, [leaflet, origin]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div ref={ref} className="h-[420px] w-full" />
    </div>);

}
