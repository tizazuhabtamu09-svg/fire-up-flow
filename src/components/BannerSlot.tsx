import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useBanners, type BannerWithUrls } from "@/lib/banners";

function Cta({ label, link }: { label: string; link: string }) {
  const internal = link.startsWith("/");
  const cls =
    "mt-4 inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background";
  if (internal) {
    return (
      <Link to={link} className={cls}>
        {label}
      </Link>
    );
  }
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className={cls}>
      {label}
    </a>
  );
}

function BannerBody({ banner }: { banner: BannerWithUrls }) {
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
          className="block h-auto w-full object-cover md:hidden"
        />
        <img
          src={desktopUrl ?? mobileUrl ?? ""}
          alt={alt}
          loading="lazy"
          className="hidden h-auto w-full object-cover md:block"
        />
      </>
    );
  }

  return (
    <div className="p-6 text-white md:p-10" style={{ background: "var(--gradient-brand)" }}>
      {banner.subtitle && (
        <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          {banner.subtitle}
        </span>
      )}
      {banner.title && (
        <h2 className="mt-3 text-2xl font-extrabold leading-tight md:text-4xl">{banner.title}</h2>
      )}
      {banner.body && <p className="mt-2 max-w-2xl text-sm text-white/90 md:text-base">{banner.body}</p>}
      {banner.cta_label && banner.cta_link && <Cta label={banner.cta_label} link={banner.cta_link} />}
    </div>
  );
}

/**
 * Renders the admin-managed advertisement banners for a placement.
 * Mobile and desktop artwork are swapped automatically by viewport.
 */
export function BannerSlot({
  placement = "home_hero",
  className = "",
  fallback = null,
}: {
  placement?: string;
  className?: string;
  fallback?: ReactNode;
}) {
  const { banners, loading } = useBanners(placement);

  if (loading) return null;
  if (banners.length === 0) return <>{fallback}</>;

  return (
    <div className={`space-y-4 ${className}`}>
      {banners.map((b) => {
        const graphic = b.kind === "graphic" && (b.desktopUrl || b.mobileUrl);
        const inner = <BannerBody banner={b} />;
        const wrapper = "overflow-hidden rounded-3xl shadow-[var(--shadow-card)]";
        if (graphic && b.cta_link) {
          return b.cta_link.startsWith("/") ? (
            <Link key={b.id} to={b.cta_link} className={`block ${wrapper}`}>
              {inner}
            </Link>
          ) : (
            <a
              key={b.id}
              href={b.cta_link}
              target="_blank"
              rel="noopener noreferrer"
              className={`block ${wrapper}`}
            >
              {inner}
            </a>
          );
        }
        return (
          <section key={b.id} className={wrapper}>
            {inner}
          </section>
        );
      })}
    </div>
  );
}
