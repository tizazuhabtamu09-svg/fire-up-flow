import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Wallet } from "lucide-react";

import appCss from "../styles.css?url";
import { useSession } from "../lib/use-session";
import { useWalletAccess } from "../lib/wallet-access";
import { useJobAccess } from "../lib/jobs";
import { CONTACT, money, BRAND } from "../lib/app-config";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LanguageProvider, useLanguage, useStandaloneTranslation } from "../lib/i18n";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { NotificationsBell } from "../components/NotificationsBell";
import { MobileBackBar } from "../components/MobileBackBar";
import { Toaster } from "../components/ui/sonner";
import logoAsset from "../assets/agaze-logo.png.asset.json";
import logoFullAsset from "../assets/agaze-logo-full.png.asset.json";


function NotFoundComponent() {
  const t = useStandaloneTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">{t("error.404Title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("error.404Desc")}</p>
        <div className="mt-6">
          <Link to="/" className="btn-brand">{t("common.goHome")}</Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const t = useStandaloneTranslation();
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">{t("error.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("error.desc")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-brand"
          >
            {t("common.retry")}
          </button>
          <a href="/" className="btn-outline-brand">{t("common.goHome")}</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${BRAND.fullName} — ${BRAND.tagline}` },
      { name: "description", content: BRAND.description },
      { property: "og:title", content: `${BRAND.fullName} — ${BRAND.tagline}` },
      { property: "og:description", content: BRAND.description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `${BRAND.fullName} — ${BRAND.tagline}` },
      { name: "twitter:description", content: BRAND.description },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1c5c8149-6c30-4c2e-8b24-a69541985e6d/id-preview-91fc873a--3650553c-feb3-40d2-a9a6-17d21c39bc31.lovable.app-1784714866844.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1c5c8149-6c30-4c2e-8b24-a69541985e6d/id-preview-91fc873a--3650553c-feb3-40d2-a9a6-17d21c39bc31.lovable.app-1784714866844.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Ethiopic:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function SiteHeader() {
  const { t } = useLanguage();
  return (
    <header className="sticky top-0 z-40 hidden border-b border-border/60 bg-background/80 backdrop-blur-lg md:block">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logoAsset.url} alt={`${BRAND.name} logo`} className="h-9 w-9 object-contain" />
          <span className="flex flex-col leading-tight">
            <span className="font-bold text-foreground">{BRAND.name}</span>
            <span className="font-amharic text-[10px] text-muted-foreground">{BRAND.amharic}</span>
          </span>
        </Link>
        <nav className="hidden flex-wrap items-center gap-x-6 gap-y-2 md:flex">
          <Link to="/workers" className="text-sm font-medium text-muted-foreground hover:text-foreground">{t("nav.findWorkers")}</Link>
          <Link to="/jobs" className="text-sm font-medium text-muted-foreground hover:text-foreground">Jobs</Link>
          <Link to="/nearby" className="text-sm font-medium text-muted-foreground hover:text-foreground">{t("nav.nearby")}</Link>
          <a href="/#services" className="text-sm font-medium text-muted-foreground hover:text-foreground">{t("nav.services")}</a>
          <PostJobLink />
          <a href="/#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">{t("nav.pricing")}</a>
        </nav>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          <LanguageSwitcher />
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}

/** "Post a Job" is visible to employers and staff (admin, sub-admin, KYC) only. */
function PostJobLink() {
  const { user } = useSession();
  const { canPost } = useJobAccess(user?.id);
  if (!canPost) return null;
  return (
    <Link to="/post-job" className="btn-brand px-4 py-1.5 text-sm">
      Post a Job
    </Link>
  );
}

function HeaderAuth() {
  const { user, loading } = useSession();
  const { t } = useLanguage();
  const { canUseWallet, balance } = useWalletAccess(user?.id);
  if (loading) return <div className="h-9 w-24" />;
  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link to="/auth" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline">{t("nav.login")}</Link>
        <Link to="/join" className="btn-brand text-sm">{t("nav.join")}</Link>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <Link to="/dashboard" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline">{t("nav.dashboard")}</Link>
      {/* Wallet badge: standard users only — hidden for admin, sub-admin and KYC. */}
      {canUseWallet && (
        <Link
          to="/payment"
          search={{ purpose: "recharge", amount: 0 }}
          className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold md:inline-flex"
        >
          <Wallet className="h-4 w-4 text-primary" />
          {money(balance ?? 0)}
        </Link>
      )}
      {/* Notification bell with unread badge (desktop-only). */}
      <NotificationsBell userId={user.id} />
      <Link to="/profile" className="btn-brand text-sm">{t("nav.account")}</Link>
    </div>
  );
}




function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="mt-20 border-t border-border/60 bg-secondary/40">
      <div className="container-page flex snap-x snap-mandatory gap-8 overflow-x-auto py-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:overflow-visible">
        <div className="w-[70%] shrink-0 snap-start md:w-auto">

          <div className="flex items-center gap-2">
            <img src={logoFullAsset.url} alt={`${BRAND.fullName} logo`} className="h-16 w-auto object-contain" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{t("footer.tagline")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/workers" className="text-sm font-medium text-primary hover:underline">{t("nav.findWorkers")}</Link>
            <Link to="/nearby" className="text-sm font-medium text-primary hover:underline">{t("nav.nearby")}</Link>
            <span className="text-sm text-muted-foreground">·</span>
            <Link to="/join" className="text-sm font-medium text-primary hover:underline">{t("nav.join")}</Link>
          </div>
        </div>
        <div className="w-[55%] shrink-0 snap-start md:w-auto">
          <h4 className="text-sm font-semibold">{t("footer.services")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/workers" className="hover:text-foreground">Cleaning</Link></li>
            <li><Link to="/workers" className="hover:text-foreground">Babysitting</Link></li>
            <li><Link to="/workers" className="hover:text-foreground">Cooking</Link></li>
            <li><Link to="/workers" className="hover:text-foreground">Waitstaff</Link></li>
            <li><a href="/#services" className="hover:text-foreground">{t("footer.allServices")}</a></li>
          </ul>
        </div>
        <div className="w-[55%] shrink-0 snap-start md:w-auto">
          <h4 className="text-sm font-semibold">{t("footer.company")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">{t("footer.about")}</Link></li>
            <li><Link to="/careers" className="hover:text-foreground">{t("footer.careers")}</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">{t("footer.contact")}</Link></li>
            <li><a href="/#pricing" className="hover:text-foreground">{t("nav.pricing")}</a></li>
          </ul>
        </div>
        <div className="w-[60%] shrink-0 snap-start md:w-auto">
          <h4 className="text-sm font-semibold">{t("footer.support")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/help" className="hover:text-foreground">{t("footer.help")}</Link></li>
            <li><Link to="/trust-safety" className="hover:text-foreground">{t("footer.trust")}</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">{t("footer.terms")}</Link></li>
            <li><a href="/#how" className="hover:text-foreground">{t("nav.how")}</a></li>
          </ul>
          <h4 className="mt-5 text-sm font-semibold">{t("footer.contact")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><a href={CONTACT.phoneHref} className="hover:text-foreground">{CONTACT.phone}</a></li>
            <li><a href={`mailto:${CONTACT.email}`} className="break-all hover:text-foreground">{CONTACT.email}</a></li>
          </ul>
        </div>
      </div>
      <div className="container-page flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} {BRAND.fullName}. {t("footer.made")}</span>
        <Link to="/terms" className="hover:text-foreground">{t("footer.termsPrivacy")}</Link>
        <Link to="/contact" className="hover:text-foreground">{t("footer.contact")}</Link>
      </div>
    </footer>
  );
}

function BackendConfigAlert() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md rounded-xl border border-border bg-card p-6 text-center">
        <h1 className="text-lg font-semibold">Backend not configured</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This deployment is missing its backend connection settings. Re-publish the app to apply the
          latest configuration.
        </p>
      </div>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  const backendReady = Boolean(
    (import.meta.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"]) &&
      (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
        import.meta.env["VITE_SUPABASE_ANON_KEY"] ||
        process.env["SUPABASE_PUBLISHABLE_KEY"]),
  );

  if (!backendReady) return <BackendConfigAlert />;


  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <SiteHeader />
        <MobileBackBar />
        <main>
          <Outlet />
        </main>
        <SiteFooter />
        <Toaster />
      </LanguageProvider>
    </QueryClientProvider>
  );

}
