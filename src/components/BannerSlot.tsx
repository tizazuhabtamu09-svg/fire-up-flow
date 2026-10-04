import { useLanguage } from "@/lib/i18n";import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useBanners, type BannerWithUrls } from "@/lib/banners";


function Cta({ label, link }: {label: string;link: string;}) {
  const internal = link.startsWith("/");
  const cls =
  "mt-4 inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background";
  if (internal) {
    return (
      <Link to={link} className={cls}>
        {label}
      </Link>);

  }
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className={cls}>
      {label}
    </a>);

}

function BannerBody({ banner }: {banner: BannerWithUrls;}) {
  const { desktopUrl, mobileUrl } = banner;
  const hasGraphic = Boolean(desktopUrl || mobileUrl);
  const alt = banner.title ?? "Advertisement";

  if (banner.kind === "graphic" && hasGraphic) {
    return (
      <>
        {/* Mobile artwork — swaps to the desktop artwork automatically on wider screens */}
        <img
          src={mobileUrl ?? desktopUrl ?? ""}
          alt={alt}
          loading="lazy"
          className="block h-auto w-full object-cover md:hidden" />
        
        <img
          src={desktopUrl ?? mobileUrl ?? ""}
          alt={alt}
          loading="lazy"
          className="hidden h-auto w-full object-cover md:block" />
        
      </>);

  }

  return (
    <div className="p-6 text-white md:p-10" style={{ background: "var(--gradient-brand)" }}>
      {banner.subtitle &&
      <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          {banner.subtitle}
        </span>
      }
      {banner.title &&
      <h2 className="mt-3 text-2xl font-extrabold leading-tight md:text-4xl">{banner.title}</h2>
      }
      {banner.body && <p className="mt-2 max-w-2xl text-sm text-white/90 md:text-base">{banner.body}</p>}
      {banner.cta_label && banner.cta_link && <Cta label={banner.cta_label} link={banner.cta_link} />}
    </div>);

}

function BannerCard({ banner }: {banner: BannerWithUrls;}) {
  const graphic = banner.kind === "graphic" && (banner.desktopUrl || banner.mobileUrl);
  const inner = <BannerBody banner={banner} />;
  const wrapper = "overflow-hidden rounded-3xl shadow-[var(--shadow-card)]";

  if (graphic && banner.cta_link) {
    return banner.cta_link.startsWith("/") ?
    <Link to={banner.cta_link} className={`block ${wrapper}`}>
        {inner}
      </Link> :

    <a href={banner.cta_link} target="_blank" rel="noopener noreferrer" className={`block ${wrapper}`}>
        {inner}
      </a>;

  }
  return <section className={wrapper}>{inner}</section>;
}

/**
 * Renders the admin-managed advertisement banners for a placement.
 * A single banner renders on its own; two or more turn into an auto-playing
 * slider with arrows and dots so admins can publish as many as they like.
 * Mobile and desktop artwork are swapped automatically by viewport.
 */
export function BannerSlot({
  placement = "home_hero",
  className = "",
  fallback = null,
  interval = 6000





}: {placement?: string;className?: string;fallback?: ReactNode;interval?: number;}) {const { t } = useLanguage();
  const { banners, loading } = useBanners(placement);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = banners.length;

  useEffect(() => {
    setIndex(0);
  }, [placement, count]);

  useEffect(() => {
    if (count < 2 || paused) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => window.clearInterval(id);
  }, [count, paused, interval]);

  if (loading) return null;
  if (count === 0) return <>{fallback}</>;

  if (count === 1) {
    return (
      <div className={className}>
        <BannerCard banner={banners[0]} />
      </div>);

  }

  const go = (next: number) => setIndex((next % count + count) % count);

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel">
      
      <div className="overflow-hidden rounded-3xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}>
          
          {banners.map((b) =>
          <div key={b.id} className="w-full shrink-0 grow-0 basis-full">
              <BannerCard banner={b} />
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => go(index - 1)}
        aria-label={t("ui.previous.banner")}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow-[var(--shadow-card)] backdrop-blur transition hover:bg-background">
        
        <span aria-hidden>‹</span>
      </button>
      <button
        type="button"
        onClick={() => go(index + 1)}
        aria-label={t("ui.next.banner")}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow-[var(--shadow-card)] backdrop-blur transition hover:bg-background">
        
        <span aria-hidden>›</span>
      </button>

      <div className="mt-3 flex items-center justify-center gap-2">
        {banners.map((b, i) =>
        <button
          key={b.id}
          type="button"
          onClick={() => go(i)}
          aria-label={`Go to banner ${i + 1}`}
          aria-current={i === index}
          className={`h-2 rounded-full transition-all ${
          i === index ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"}`
          } />

        )}
      </div>
    </div>);

}
