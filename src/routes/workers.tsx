import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Star, MapPin, SlidersHorizontal, X } from "lucide-react";
import { SERVICE_FILTERS, AREAS } from "@/lib/workers-data";
import { useAvailableEmployees } from "@/lib/employees";
import { EmployeeAvatar } from "@/components/EmployeeAvatar";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/workers")({
  head: () => ({
    meta: [
      { title: "Browse Verified Workers — Agaze/አጋዝ" },
      { name: "description", content: "Search and filter verified cleaners, babysitters, cooks and waitstaff by service, area, rating and availability in Addis Ababa." },
      { property: "og:title", content: "Browse Verified Workers — Agaze/አጋዝ" },
      { property: "og:description", content: "Search and filter verified domestic workers by service, area, rating and availability." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkersPage,
});

type SortKey = "rating" | "experience" | "price_low" | "price_high";

function WorkersPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [service, setService] = useState<string>("");
  const [area, setArea] = useState<string>("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<SortKey>("rating");
  const { workers: dbWorkers, loading } = useAvailableEmployees();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = dbWorkers.filter((w) => {
      if (q && !`${w.name} ${w.role} ${w.area} ${w.city}`.toLowerCase().includes(q)) return false;
      if (service && w.role !== service) return false;
      if (area && w.area !== area) return false;
      if (availableOnly && !w.available) return false;
      if (minRating > 0) return false;
      return true;
    });
    return list.sort((a, b) => {
      if (sort === "rating") return b.years - a.years;
      if (sort === "experience") return b.years - a.years;
      if (sort === "price_low") return a.rate - b.rate;
      return b.rate - a.rate;
    });
  }, [query, service, area, availableOnly, minRating, sort, dbWorkers]);

  const hasFilters = Boolean(query || service || area || availableOnly || minRating);

  function clearAll() {
    setQuery("");
    setService("");
    setArea("");
    setAvailableOnly(false);
    setMinRating(0);
  }

  return (
    <div style={{ background: "var(--gradient-warm)" }}>
      <div className="container-page py-12">
        <div className="max-w-2xl">
          <span className="chip">{t("workers.tag")}</span>
          <h1 className="mt-4 text-4xl font-bold break-words">{t("workers.title")}</h1>
          <p className="font-amharic text-muted-foreground">ሰራተኛ ይፈልጉ</p>
          <p className="mt-3 text-muted-foreground">
            {t("workers.desc")}
          </p>
        </div>

        {/* Search bar */}
        <div className="card-soft mt-8 p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("workers.searchPlaceholder")}
                aria-label={t("workers.searchAria")}
                className="w-full rounded-full border border-input bg-background py-2.5 pl-10 pr-4 outline-none focus:border-primary"
              />
            </div>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              aria-label={t("workers.filterService")}
              className="rounded-full border border-input bg-background px-4 py-2.5 outline-none focus:border-primary"
            >
              <option value="">{t("workers.allServices")}</option>
              {SERVICE_FILTERS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              aria-label={t("workers.filterArea")}
              className="rounded-full border border-input bg-background px-4 py-2.5 outline-none focus:border-primary"
            >
              <option value="">{t("workers.allAreas")}</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4 shrink-0" /> {t("workers.refine")}
            </span>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
              {t("workers.availableNow")}
            </label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              aria-label={t("workers.minRating")}
              className="rounded-full border border-input bg-background px-3 py-1.5 outline-none focus:border-primary"
            >
              <option value={0}>{t("workers.anyRating")}</option>
              <option value={4}>4.0+</option>
              <option value={4.5}>4.5+</option>
              <option value={4.8}>4.8+</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label={t("workers.sort")}
              className="rounded-full border border-input bg-background px-3 py-1.5 outline-none focus:border-primary"
            >
              <option value="rating">{t("workers.sortRating")}</option>
              <option value="experience">{t("workers.sortExperience")}</option>
              <option value="price_low">{t("workers.sortPriceLow")}</option>
              <option value="price_high">{t("workers.sortPriceHigh")}</option>
            </select>
            {hasFilters && (
              <button onClick={clearAll} className="ml-auto inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5 shrink-0" /> {t("common.clearFilters")}
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          {loading ? t("workers.loading") : t("workers.found", { count: results.length })}
        </p>


        {results.length === 0 ? (
          <div className="card-soft mt-6 p-12 text-center">
            <div className="text-4xl">🔍</div>
            <h2 className="mt-3 text-xl font-bold">{t("workers.emptyTitle")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("workers.emptyDesc")}</p>
            <button onClick={clearAll} className="btn-outline-brand mt-6">{t("common.clearFilters")}</button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 pb-8 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((w) => (
              <article key={w.id} className="card-soft overflow-hidden">
                <EmployeeAvatar photoUrl={w.photoUrl} name={w.name} className="h-36 w-full rounded-none" />
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-bold break-words">{w.name}</h2>
                      <p className="text-xs" style={{ color: "var(--brand-dark)" }}>{w.role}</p>
                    </div>
                    {w.faydaVerified && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        {t("workers.idVerified")}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />{w.area ? `${w.area}, ` : ""}{w.city}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {w.years ? t("workers.yearsExp", { count: w.years }) : t("workers.expOnProfile")}
                  </div>
                  <div className="mt-3 text-sm font-bold" style={{ color: "var(--brand-dark)" }}>
                    {w.rate ? <>ETB {w.rate.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">{t("common.perMonth")}</span></> : t("workers.rateOnRequest")}
                  </div>
                  <Link
                    to="/employee/$id" params={{ id: w.id }}
                    className="mt-4 block rounded-full py-2 text-center text-sm font-semibold transition"
                    style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}
                  >
                    {t("common.bookNow")}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
