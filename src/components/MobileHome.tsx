import { useLanguage } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight, Mic, Sparkles, Star, MapPin, Briefcase,
  Home as HomeIcon, FileText, Users, ClipboardList, Menu, ChevronRight, ChevronLeft,
} from "lucide-react";
import { MobileMenu } from "@/components/MobileMenu";
import { EmployeeAvatar } from "@/components/EmployeeAvatar";
import { useAvailableEmployees } from "@/lib/employees";
import { useSession } from "@/lib/use-session";
import { BRAND, money } from "@/lib/app-config";
import { usePublicPlans } from "@/lib/pricing";
import { usePublishedJobs } from "@/lib/jobs";
import { BannerSlot } from "@/components/BannerSlot";
import logoAsset from "@/assets/agaze-logo.png.asset.json";


const glass =
  "rounded-3xl border border-border/60 bg-card/70 shadow-[var(--shadow-card)] backdrop-blur-xl";

const services = [
  { icon: "🏠", title: "All in One", am: "ሁለገብ", from: "ETB 6,000", workers: "45+" },
  { icon: "🧹", title: "House Cleaning", am: "ቤት ማፅዳት", from: "ETB 6,000", workers: "120+" },
  { icon: "👶", title: "Babysitting", am: "ልጅ መንከባከብ", from: "ETB 5,500", workers: "85+" },
  { icon: "👨‍🍳", title: "Cooking", am: "ምግብ ማብሰል", from: "ETB 8,000", workers: "65+" },
  { icon: "🍽️", title: "Waitstaff", am: "አስተናጋጅ", from: "ETB 3,500", workers: "30+" },
  { icon: "🔧", title: "Skilled Trades", am: "ሙያተኞች", from: "ETB 4,000", workers: "40+" },
];




export function MobileHome() {
  const { t } = useLanguage();
  const { user, loading: sessionLoading } = useSession();
  const { workers } = useAvailableEmployees(6);
  const { plans } = usePublicPlans();
  const { jobs, loading: jobsLoading } = usePublishedJobs(4);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showJoinButton, setShowJoinButton] = useState(true);
  const servicesRef = useRef<HTMLDivElement | null>(null);
  const [servicesIndex, setServicesIndex] = useState(0);


  useEffect(() => {
    let timeoutId: number | undefined;

    const handleScroll = () => {
      setShowJoinButton(false);
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => setShowJoinButton(true), 500);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const el = servicesRef.current;
    if (!el) return;
    const onScroll = () => {
      const cardWidth = 124; // w-[6.75rem] + gap-3 (12px)
      const idx = Math.round(el.scrollLeft / cardWidth);
      setServicesIndex(Math.max(0, Math.min(idx, services.length - 1)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);


  return (
    <div className="md:hidden" style={{ background: "var(--gradient-warm)" }}>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      {/* Fixed mobile header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-lg md:hidden">
        <div className="mx-auto flex h-[4.5rem] w-full max-w-md items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src={logoAsset.url} alt={`${BRAND.name} logo`} className="h-11 w-11 object-contain" />
            <span className="flex flex-col leading-tight">
              <span className="text-2xl font-extrabold">{BRAND.name}</span>
              <span className="font-amharic text-[11px] text-muted-foreground">{BRAND.amharic}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Notifications are a desktop-only affordance; the bell is hidden on mobile. */}
            <button
              type="button"
              aria-label="Open account menu"
              onClick={() => setMenuOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-xl"
              style={{ background: "var(--brand-soft)" }}
            >
              👤
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-md px-4 pb-32 pt-[5.75rem]">

        {/* Search pill */}
        <Link to="/workers" className={`${glass} mt-5 flex items-center gap-3 py-2 pl-4 pr-2`}>
          <Sparkles className="h-5 w-5 shrink-0" style={{ color: "var(--brand)" }} />
          <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            Search cleaners, cooks, babysitters…
          </span>
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}
          >
            <Mic className="h-4 w-4" />
          </span>
        </Link>

        {/* Admin-managed advertisement banner (mobile artwork) */}
        <BannerSlot
          placement="home_hero"
          className="mt-5"
          fallback={
            <section className="relative mt-5 overflow-hidden rounded-3xl p-5" style={{ background: "var(--gradient-brand)" }}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                <Star className="h-3 w-3 fill-current" /> Trusted by 5,000+ households
              </span>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight text-white">
                Find Trusted Domestic Workers Near You
              </h1>
              <p className="font-amharic mt-2 text-xs text-white/85">የቤት ውስጥ አገልግሎቶች በቀላሉ ያግኙ</p>
              <div className="mt-5 flex items-center gap-3">
                <Link
                  to="/workers"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background"
                >
                  <ArrowUpRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/join"
                  className="rounded-full border border-white/60 px-5 py-3 text-sm font-semibold text-white"
                >
                  Become a Worker
                </Link>
              </div>
            </section>
          }
        />

        {/* Stats strip */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { n: "270+", l: "Workers" },
            { n: "5,000+", l: "Households" },
            { n: "4.8", l: "Rating" },
          ].map((s) => (
            <div key={s.l} className={`${glass} px-2 py-3 text-center`}>
              <div className="text-lg font-extrabold" style={{ color: "var(--brand-dark)" }}>{s.n}</div>
              <div className="text-[11px] text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Suggested for you = services (user-controlled horizontal slider) */}
        <div className="mt-7 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{t("home.whatWeOffer")}</h2>
            <p className="text-[11px] text-muted-foreground">Swipe to explore services</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Scroll services left"
              onClick={() => servicesRef.current?.scrollBy({ left: -160, behavior: "smooth" })}
              className={`${glass} flex h-8 w-8 items-center justify-center`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Scroll services right"
              onClick={() => servicesRef.current?.scrollBy({ left: 160, behavior: "smooth" })}
              className={`${glass} flex h-8 w-8 items-center justify-center`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div
          ref={servicesRef}
          className="mt-3 -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {services.map((s, i) => (
            <Link
              key={`${s.title}-${i}`}
              to="/workers"
              className={`${glass} relative w-[6.75rem] shrink-0 snap-start p-3`}
            >
              <ArrowUpRight className="absolute right-2 top-2 h-4 w-4 text-muted-foreground" />
              <span
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl"
                style={{ background: "var(--brand-soft)" }}
              >
                {s.icon}
              </span>
              <div className="mt-3 text-xs font-semibold leading-tight">{s.title}</div>
              <div className="font-amharic text-[10px] text-muted-foreground">{s.am}</div>
              <div className="mt-1 text-[10px] font-bold" style={{ color: "var(--brand-dark)" }}>{s.from}</div>
            </Link>
          ))}
        </div>
        <div className="mt-2 flex justify-center gap-1.5">
          {services.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to service ${i + 1}`}
              onClick={() => servicesRef.current?.scrollTo({ left: i * 124, behavior: "smooth" })}
              className={`h-1.5 rounded-full transition-all ${i === servicesIndex ? "w-4" : "w-1.5"}`}
              style={{ background: i === servicesIndex ? "var(--brand)" : "var(--border)" }}
            />
          ))}
        </div>







        {/* Job postings — approved open jobs */}
        <div className="mt-7 flex items-center justify-between">
          <h2 className="text-lg font-bold">Job Postings</h2>
          <Link to="/jobs" className="flex items-center text-xs font-semibold" style={{ color: "var(--brand-dark)" }}>
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className={`${glass} mt-3 space-y-2 p-3`}>
          {jobs.map((job) => (
            <Link
              key={job.id}
              to="/jobs/$id"
              params={{ id: job.id }}
              className="flex items-center gap-3 rounded-2xl bg-background/60 px-3 py-3"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}
              >
                <Briefcase className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{job.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {[job.city, job.area].filter(Boolean).join(" · ") || "Ethiopia"}
                  {job.salary != null ? ` · ${money(Number(job.salary))}/mo` : ""}
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
          {!jobsLoading && jobs.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No approved job postings yet — check back soon.
            </p>
          )}
        </div>

        {/* Featured workers */}
        <div className="mt-7 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t("home.featured")}</h2>
          <Link to="/workers" className="flex items-center text-xs font-semibold" style={{ color: "var(--brand-dark)" }}>
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-3 space-y-3">
          {workers.map((w) => (
            <div key={w.id} className={`${glass} flex items-center gap-3 p-3`}>
              <EmployeeAvatar photoUrl={w.photoUrl} name={w.name} className="h-12 w-12 rounded-2xl" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{w.name}</div>
                <div className="text-xs" style={{ color: "var(--brand-dark)" }}>{w.role}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{w.area || w.city}
                  </span>
                  {w.faydaVerified && <span className="text-emerald-700">ID verified</span>}
                </div>
              </div>
              <Link
                to="/employee/$id"
                params={{ id: w.id }}
                className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold"
                style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}
              >
                Book
              </Link>
            </div>
          ))}
          {workers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No employees available yet — approved profiles appear here automatically.
            </p>
          )}
        </div>




        {/* Pricing — admin-managed plans */}
        <h2 className="mt-7 text-lg font-bold">{t("home.pricingTitle")}</h2>
        {plans.map((p) =>
          p.featured ? (
            <div key={p.key} className="mt-3 rounded-3xl p-5 text-center" style={{ background: "var(--gradient-brand)" }}>
              <div className="text-sm text-white/85">{p.name}</div>
              <div className="mt-1 text-4xl font-extrabold text-white">ETB {p.price.toLocaleString()}</div>
              {p.description && <div className="mt-1 text-xs text-white/80">{p.description}</div>}
              <Link
                to="/payment"
                search={{ purpose: "subscription", amount: p.price, package: p.key }}
                className="mt-5 block rounded-full bg-foreground py-3 text-sm font-semibold text-background"
              >
                Subscribe Now
              </Link>
            </div>
          ) : (
            <div key={p.key} className={`${glass} mt-3 p-4`}>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-sm font-bold">{p.name}</div>
                  {p.description && <div className="text-xs text-muted-foreground">{p.description}</div>}
                </div>
                <div className="text-xl font-extrabold" style={{ color: "var(--brand-dark)" }}>ETB {p.price.toLocaleString()}</div>
              </div>
              <Link
                to="/payment"
                search={{ purpose: "subscription", amount: p.price, package: p.key }}
                className="mt-4 block rounded-full border border-border py-2.5 text-center text-sm font-semibold"
              >
                Get Started
              </Link>
            </div>
          ),
        )}
        {plans.length === 0 && (
          <p className="mt-3 text-center text-xs text-muted-foreground">Plans are being updated — check back shortly.</p>
        )}

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Are you a domestic worker?{" "}
          <Link to="/join/employee" className="font-semibold" style={{ color: "var(--brand-dark)" }}>
            Register for free
          </Link>
        </p>




        {/* CTA — hidden for signed-in users */}
        {!user && !sessionLoading && (
          <div className={`${glass} mt-7 p-5 text-center`}>
            <h2 className="text-xl font-extrabold">{t("home.ctaTitle")}</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Join thousands of households who trust us for their home service needs.
            </p>
            <p className="font-amharic mt-1 text-xs text-muted-foreground">አሁኑኑ ይጀምሩ</p>
            <div className="mt-4 flex flex-col gap-2">
              <Link to="/join" className="btn-brand w-full">{t("common.signUpNow")}</Link>
              <Link to="/workers" className="btn-outline-brand w-full">{t("common.browseWorkers")}</Link>
            </div>
          </div>
        )}
      </div>

      {/* Floating join CTA */}
      {!user && !sessionLoading && (
        <Link
          to="/join"
          className={`fixed bottom-24 right-4 z-40 whitespace-nowrap rounded-full px-5 py-3 text-sm font-bold shadow-[var(--shadow-glow)] transition-all duration-500 md:hidden ${
            showJoinButton ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
          }`}
          style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}
        >
          Join Now
        </Link>
      )}

      {/* Floating bottom nav */}
      <nav className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 md:hidden">
        <div className={`${glass} flex items-center gap-2 p-2`}>
          {[
            { to: "/", icon: <HomeIcon className="h-5 w-5" />, active: true, label: "Home" },
            { to: "/workers", icon: <FileText className="h-5 w-5" />, label: "Workers" },
            { to: "/nearby", icon: <Sparkles className="h-5 w-5" />, label: "Nearby", brand: true },
            { to: "/join", icon: <Users className="h-5 w-5" />, label: "Join" },
            { to: "/dashboard", icon: <ClipboardList className="h-5 w-5" />, label: "Dashboard" },
          ].map((i) => (
            <Link
              key={i.to}
              to={i.to}
              aria-label={i.label}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60"
              style={
                i.active
                  ? { background: "var(--foreground)", color: "var(--background)", borderColor: "transparent" }
                  : i.brand
                    ? { background: "var(--gradient-brand)", color: "var(--brand-foreground)", borderColor: "transparent" }
                    : { background: "var(--background)" }
              }
            >
              {i.icon}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
