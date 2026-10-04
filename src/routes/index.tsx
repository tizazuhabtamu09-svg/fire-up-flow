import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shield, Clock, Star, Check, ArrowRight, MapPin, Sparkles, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
import { useAvailableEmployees } from "@/lib/employees";
import { EmployeeAvatar } from "@/components/EmployeeAvatar";
import { MobileHome } from "@/components/MobileHome";
import { useLanguage } from "@/lib/i18n";
import { BRAND, money } from "@/lib/app-config";
import { usePublicPlans } from "@/lib/pricing";
import { employmentLabel, usePublishedJobs } from "@/lib/jobs";
import { BannerSlot } from "@/components/BannerSlot";
import { useBanners } from "@/lib/banners";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
    { title: `${BRAND.fullName} — ${BRAND.tagline}` },
    { name: "description", content: BRAND.description },
    { property: "og:title", content: `${BRAND.fullName} — ${BRAND.tagline}` },
    { property: "og:description", content: BRAND.description }]

  }),
  component: Home
});

const services = [
{ icon: "🏠", title: "All in One", am: "ሁለገብ", desc: "Permanent household help skilled in cooking, cleaning, and babysitting.", from: "ETB 6,000", workers: "45+" },
{ icon: "🧹", title: "House Cleaning", am: "ቤት ማፅዳት", desc: "Professional cleaning, deep cleaning, and regular maintenance.", from: "ETB 6,000", workers: "120+" },
{ icon: "👶", title: "Babysitting", am: "ልጅ መንከባከብ", desc: "Trusted, caring babysitters for infants, toddlers and older kids.", from: "ETB 5,500", workers: "85+" },
{ icon: "👨‍🍳", title: "Cooking", am: "ምግብ ማብሰል", desc: "Skilled cooks for daily meals and traditional Ethiopian cuisine.", from: "ETB 8,000", workers: "65+" },
{ icon: "🍽️", title: "Waitress & Waiter", am: "አስተናጋጅ", desc: "Professional waitstaff for events and private gatherings.", from: "ETB 3,500", workers: "30+" }];




function Home() {
  const { t } = useLanguage();
  const { workers } = useAvailableEmployees(4);
  const { plans } = usePublicPlans();
  const { jobs, loading: jobsLoading } = usePublishedJobs(6);
  const { banners: heroBanners } = useBanners("home_hero");
  const servicesRef = useRef<HTMLDivElement | null>(null);
  const scrollServices = (dir: -1 | 1) =>
  servicesRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  return (
    <>
      <MobileHome />
      <div className="hidden md:block">
      {/* Admin-managed advertisement banner (desktop artwork) */}
      <BannerSlot placement="home_hero" className="container-page pt-8" />
      {/* HERO — shown only when no banner is published */}
      {heroBanners.length === 0 &&
        <section className="relative overflow-hidden" style={{ background: "var(--gradient-warm)" }}>
        <div aria-hidden className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full opacity-40 blur-3xl" style={{ background: "var(--brand-soft)" }} />
        <div className="container-page relative grid gap-12 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <span className="chip w-fit"><Star className="h-3.5 w-3.5 fill-current" />{t("home.badge")}</span>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] text-foreground md:text-6xl">
              {t("home.hero1")}{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-white px-3" style={{ background: "var(--gradient-brand)", borderRadius: "0.5rem" }}>{t("home.hero2")}</span>
              </span>{" "}
              {t("home.hero3")}
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              {t("home.heroDesc")}
            </p>
            <p className="font-amharic mt-3 text-sm text-muted-foreground">የቤት ውስጥ አገልግሎቶች በቀላሉ ያግኙ</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/workers" className="btn-brand">{t("home.findWorker")} <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/join" className="btn-outline-brand">{t("home.becomeWorker")}</Link>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {[
                { icon: <Shield className="h-4 w-4" />, label: t("home.trust1"), sub: t("home.trust1sub") },
                { icon: <Clock className="h-4 w-4" />, label: t("home.trust2"), sub: t("home.trust2sub") },
                { icon: <Star className="h-4 w-4" />, label: t("home.trust3"), sub: t("home.trust3sub") }].
                map((t) =>
                <div key={t.label} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}>{t.icon}</span>
                  <div>
                    <div className="text-sm font-semibold">{t.label}</div>
                    <div className="text-xs text-muted-foreground">{t.sub}</div>
                  </div>
                </div>
                )}
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative flex items-center justify-center">
            <div className="relative h-[440px] w-[440px] max-w-full">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-border/70" />
              <div className="absolute inset-8 rounded-full border border-dashed border-border/50" />
              <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card shadow-[var(--shadow-glow)] flex flex-col items-center justify-center">
                <div className="text-4xl font-extrabold" style={{ color: "var(--brand-dark)" }}>270+</div>
                <div className="text-xs font-medium text-muted-foreground">{t("home.activeWorkers")}</div>
              </div>
              {[
                { icon: "🧹", label: "Cleaning", sub: "120+ workers", pos: "top-4 right-2" },
                { icon: "👶", label: "Babysitting", sub: "85+ workers", pos: "top-1/2 left-0 -translate-y-1/2" },
                { icon: "👨‍🍳", label: "Cooking", sub: "65+ workers", pos: "bottom-4 right-4" }].
                map((f) =>
                <div key={f.label} className={`card-soft absolute ${f.pos} flex items-center gap-3 px-4 py-3`}>
                  <span className="text-2xl">{f.icon}</span>
                  <div>
                    <div className="text-sm font-semibold">{f.label}</div>
                    <div className="text-xs text-muted-foreground">{f.sub}</div>
                  </div>
                </div>
                )}
            </div>
          </div>
        </div>
      </section>
        }

      {/* SERVICES */}
      <section id="services" className="container-page py-20">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div className="min-w-0 max-w-2xl">
            <span className="chip"><Sparkles className="h-3.5 w-3.5" />{t("home.ourServices")}</span>
            <h2 className="mt-4 text-4xl font-bold">{t("home.whatWeOffer")}</h2>
            <p className="mt-3 text-muted-foreground">{t("home.servicesDesc")}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" aria-label={t("ui.scroll.services.left")} onClick={() => scrollServices(-1)} className="btn-outline-brand h-11 w-11 !px-0">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" aria-label={t("ui.scroll.services.right")} onClick={() => scrollServices(1)} className="btn-outline-brand h-11 w-11 !px-0">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div
            ref={servicesRef}
            className="mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            
          {services.map((s) =>
            <article key={s.title} className="card-soft group w-72 shrink-0 snap-start p-6 transition hover:-translate-y-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl" style={{ background: "var(--brand-soft)" }}>{s.icon}</div>
              <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
              <p className="font-amharic text-sm" style={{ color: "var(--brand-dark)" }}>{s.am}</p>
              <p className="mt-3 text-sm text-muted-foreground">{s.desc}</p>
              <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
                <div>
                  <div className="text-xs text-muted-foreground">{t("common.from")}</div>
                  <div className="font-bold" style={{ color: "var(--brand-dark)" }}>{s.from}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{t("common.workers")}</div>
                  <div className="font-bold">{s.workers}</div>
                </div>
              </div>
              <Link to="/workers" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--brand-dark)" }}>
                {t("common.browseWorkers")} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </article>
            )}
        </div>
      </section>

      {/* JOB POSTINGS */}
      <section id="jobs" className="bg-secondary/40 py-20">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <span className="chip"><Briefcase className="h-3.5 w-3.5" />{t("ui.job.postings")}</span>
              <h2 className="mt-4 text-4xl font-bold">{t("ui.latest.open.jobs")}</h2>
              <p className="font-amharic mt-1" style={{ color: "var(--brand-dark)" }}>ክፍት የስራ ቦታዎች</p>
              <p className="mt-3 text-muted-foreground">{t("ui.verified.openings.from.employers.reviewed.by.our.team")}

                </p>
            </div>
            <Link to="/jobs" className="btn-outline-brand text-sm">{t("ui.view.all.jobs")}<ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) =>
              <Link
                key={job.id}
                to="/jobs/$id"
                params={{ id: job.id }}
                className="card-soft group flex flex-col p-6 transition hover:-translate-y-1">
                
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold">{job.title}</h3>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold uppercase text-muted-foreground">
                    {employmentLabel(job.employment_type)}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {[job.city, job.sub_city, job.area].filter(Boolean).join(" · ") || "Ethiopia"}
                </p>
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{job.description}</p>
                {job.salary != null &&
                <p className="mt-3 text-sm font-semibold" style={{ color: "var(--brand-dark)" }}>
                    {money(Number(job.salary))}
                    {job.salary_max != null ? ` – ${money(Number(job.salary_max))}` : ""}{t("ui.month")}
                </p>
                }
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold" style={{ color: "var(--brand-dark)" }}>{t("ui.view.apply")}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
              )}
          </div>
          {!jobsLoading && jobs.length === 0 &&
            <p className="mt-10 text-center text-muted-foreground">{t("ui.no.approved.job.postings.yet.new.openings.appear.here")}

            </p>
            }
        </div>
      </section>

      {/* WORKERS */}
      <section id="workers" className="container-page py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <span className="chip">{t("home.topRated")}</span>
            <h2 className="mt-4 text-4xl font-bold">{t("home.featured")}</h2>
            <p className="mt-3 text-muted-foreground">{t("home.featuredDesc")}</p>
          </div>
          <Link to="/workers" className="btn-outline-brand text-sm">{t("common.viewAll")} <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {workers.map((w) =>
            <article key={w.id} className="card-soft overflow-hidden">
              <EmployeeAvatar photoUrl={w.photoUrl} name={w.name} className="h-40 w-full rounded-none" />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold">{w.name}</h3>
                    <p className="text-xs" style={{ color: "var(--brand-dark)" }}>{w.role}</p>
                  </div>
                  {w.faydaVerified &&
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">{t("ui.verified")}

                  </span>
                  }
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />{w.area ? `${w.area}, ` : ""}{w.city}
                </div>
                <div className="text-xs text-muted-foreground">
                  {w.years ? `${w.years} years exp` : "Experience on profile"}
                </div>
                <Link
                  to="/employee/$id"
                  params={{ id: w.id }}
                  className="mt-4 block w-full rounded-full py-2 text-center text-sm font-semibold transition"
                  style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}>
                  
                  {t("common.bookNow")}
                </Link>
              </div>
            </article>
            )}
        </div>
        {workers.length === 0 &&
          <p className="mt-10 text-center text-muted-foreground">{t("ui.no.employees.are.available.right.now.new.profiles.appe")}

          </p>
          }
      </section>

      {/* TRUST & SAFETY */}
      <section className="container-page pb-4">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: <Shield className="h-5 w-5" />, title: "ID & Fayda verified", am: "የተረጋገጠ መታወቂያ", desc: "Every worker submits front and back ID photos plus their Fayda number before going live." },
            { icon: <Check className="h-5 w-5" />, title: "Reference checked", am: "ማጣቀሻ ተረጋግጧል", desc: "We contact previous employers and confirm experience before a profile is published." },
            { icon: <Star className="h-5 w-5" />, title: "Rated after every job", am: "ደረጃ አሰጣጥ", desc: "Ratings come only from households that completed and paid for a booking." }].
            map((t) =>
            <div key={t.title} className="card-soft p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}>{t.icon}</span>
              <h3 className="mt-4 text-lg font-bold">{t.title}</h3>
              <p className="font-amharic text-sm" style={{ color: "var(--brand-dark)" }}>{t.am}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
            </div>
            )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="chip">{t("home.testimonialsTag")}</span>
          <h2 className="mt-4 text-4xl font-bold">{t("home.testimonialsTitle")}</h2>
          <p className="font-amharic text-muted-foreground">ደንበኞቻችን ምን ይላሉ</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { quote: "I found a babysitter in two days. The verification gave me real peace of mind.", name: "Sara M.", role: "Household, Bole", avatar: "👩🏽" },
            { quote: `Our cook has been with us for a year now. Booking through ${BRAND.name} was simple and fair.`, name: "Yohannes T.", role: "Household, CMC", avatar: "🧑🏾" },
            { quote: "As a worker, I got hired within a week. Payments and terms were clear from the start.", name: "Almaz T.", role: "Cleaner, Megenagna", avatar: "👩🏾" }].
            map((t) =>
            <figure key={t.name} className="card-soft p-6">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) =>
                <Star key={i} className="h-4 w-4 fill-current" style={{ color: "var(--brand)" }} />
                )}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed">“{t.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full text-xl" style={{ background: "var(--brand-soft)" }}>{t.avatar}</span>
                <span>
                  <span className="block text-sm font-semibold">{t.name}</span>
                  <span className="block text-xs text-muted-foreground">{t.role}</span>
                </span>
              </figcaption>
            </figure>
            )}
        </div>
      </section>



      {/* PRICING */}
      <section id="pricing" className="bg-secondary/40 py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="chip">{t("home.pricingTag")}</span>
            <h2 className="mt-4 text-4xl font-bold">{t("home.pricingTitle")}</h2>
            <p className="mt-3 text-muted-foreground">{t("home.pricingDesc")}</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            {plans.map((p) =>
              <div key={p.key} className={`card-soft relative p-8 ${p.featured ? "ring-2" : ""}`} style={p.featured ? { boxShadow: "var(--shadow-glow)", borderColor: "var(--brand)" } : undefined}>
                {p.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: "var(--gradient-brand)" }}>{t("home.mostPopular")}</span>}
                <h3 className="text-2xl font-bold">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-sm">{t("ui.etb")}</span>
                  <span className="text-5xl font-extrabold">{p.price.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">{t("common.perMonth")}</span>
                </div>
                {p.description && <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>}
                <Link
                  to="/payment"
                  search={{ purpose: "subscription", amount: p.price, package: p.key }}
                  className={`mt-8 block text-center ${p.featured ? "btn-brand" : "btn-outline-brand"}`}>
                  
                  {p.featured ? t("common.subscribe") : t("common.getStarted")}
                </Link>
              </div>
              )}
            {plans.length === 0 &&
              <p className="text-center text-muted-foreground md:col-span-2">{t("ui.plans.are.being.updated.check.back.shortly")}</p>
              }

          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t("home.workerCta")} <Link to="/join/employee" className="font-semibold" style={{ color: "var(--brand-dark)" }}>{t("home.registerFree")}</Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="chip">{t("home.faqTag")}</span>
          <h2 className="mt-4 text-4xl font-bold">{t("home.faqTitle")}</h2>
          <p className="font-amharic text-muted-foreground">ተደጋጋሚ ጥያቄዎች</p>
        </div>
        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {[
            { q: "How are workers verified?", a: "Every worker submits a Fayda number and front/back ID photos, which we check manually. We also confirm references before publishing a profile." },
            { q: "How much does it cost to hire?", a: "Monthly rates start from ETB 3,500 for waitstaff and go up to ETB 9,000 for experienced cooks. The plan fee is separate and covers bookings on the platform." },
            { q: "Is registration free for workers?", a: "Yes. Workers register for free through Join → Employee. You only need your ID and basic details." },
            { q: "Which areas do you cover?", a: "Today we serve Addis Ababa — Bole, Kazanchis, CMC, Megenagna, Piassa, Sarbet and Gerji — with more areas coming soon." },
            { q: "What if a worker isn't a good fit?", a: "Tell us within the first week and we'll match you with another verified worker at no extra cost." }].
            map((f) =>
            <details key={f.q} className="card-soft group p-5">
              <summary className="cursor-pointer list-none font-semibold marker:content-none">
                <span className="flex items-center justify-between gap-4">
                  {f.q}
                  <span className="text-xl transition group-open:rotate-45" style={{ color: "var(--brand-dark)" }}>+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
            )}
        </div>
      </section>


      {/* CTA */}
      <section className="container-page py-20">
        <div className="relative overflow-hidden rounded-3xl px-8 py-16 text-center md:px-16" style={{ background: "var(--gradient-brand)" }}>
          <div className="relative z-10 mx-auto max-w-2xl text-white">
            <h2 className="text-4xl font-extrabold md:text-5xl">{t("home.ctaTitle")}</h2>
            <p className="mt-4 text-white/90">{t("home.ctaDesc")}</p>
            <p className="font-amharic mt-2 text-sm text-white/80">{t("ui.start.now")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/join" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold" style={{ color: "var(--brand-dark)" }}>{t("common.signUpNow")} <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/workers" className="inline-flex items-center gap-2 rounded-full border border-white/60 px-6 py-3 font-semibold text-white hover:bg-white/10">{t("common.browseWorkers")}</Link>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/20 pt-8">
              {[
                { n: "5,000+", l: t("home.stat1") },
                { n: "270+", l: t("home.stat2") },
                { n: "4.8", l: t("home.stat3") }].
                map((s) =>
                <div key={s.l}>
                  <div className="text-3xl font-extrabold">{s.n}</div>
                  <div className="text-sm text-white/80">{s.l}</div>
                </div>
                )}
            </div>
          </div>
        </div>
      </section>
      </div>
    </>);

}
