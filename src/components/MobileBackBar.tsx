import { useLanguage } from "@/lib/i18n";import { Link, useRouter, useRouterState } from "@tanstack/react-router";

export function MobileBackBar() {const { t } = useLanguage();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Home already has its own mobile header
  if (pathname === "/") return null;

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-border/60 bg-background/90 px-3 py-2 backdrop-blur-lg md:hidden">
      <button
        type="button"
        onClick={() => router.history.back()}
        aria-label={t("ui.go.back")}
        className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3 py-2 text-sm font-medium text-foreground active:scale-95">
        
        <span aria-hidden="true">←</span>{t("ui.back")}

      </button>
      <Link
        to="/"
        aria-label={t("ui.go.to.home")}
        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground active:scale-95">
        
        <span aria-hidden="true">🏠</span>{t("ui.home")}

      </Link>
    </div>);

}
