import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  X, User, MessageSquare, Settings, Search, Briefcase, LayoutGrid,
  LifeBuoy, Info, LogOut, ShieldCheck, Sun, Moon, Check, KeyRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { useTheme } from "@/lib/theme";
import { LANGUAGES, useLanguage } from "@/lib/i18n";
import { ChangePassword } from "@/components/ChangePassword";
import { BRAND } from "@/lib/app-config";

type Item = { to: string; label: string; icon: React.ReactNode };


// Consolidated navigation. Every destination appears exactly once — the
// duplicate "Settings"/"Worker Dashboard" entries that both pointed at
// /dashboard were merged away; all settings live in the single Settings
// section at the bottom of this menu.
const groups: { title: string; items: Item[] }[] = [
  {
    title: "Account",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: <LayoutGrid className="h-5 w-5" /> },
      { to: "/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
      { to: "/my-employer", label: "My Employer", icon: <Briefcase className="h-5 w-5" /> },
      { to: "/messages", label: "Messages", icon: <MessageSquare className="h-5 w-5" /> },

    ],
  },
  {
    title: "Explore",
    items: [
      { to: "/workers", label: "Find Workers", icon: <Search className="h-5 w-5" /> },
      { to: "/jobs", label: "Open Jobs", icon: <Briefcase className="h-5 w-5" /> },
      { to: "/my-jobs", label: "My Job Posts", icon: <LayoutGrid className="h-5 w-5" /> },
      { to: "/join/employee", label: "Become a Worker", icon: <Briefcase className="h-5 w-5" /> },
    ],
  },
  {
    title: "Support",
    items: [
      { to: "/help", label: "Help Center", icon: <LifeBuoy className="h-5 w-5" /> },
      { to: "/trust-safety", label: "Trust & Safety", icon: <ShieldCheck className="h-5 w-5" /> },
      { to: "/about", label: "About Us", icon: <Info className="h-5 w-5" /> },
    ],
  },
];


const faqs = [
  { q: "How are workers verified?", a: "Every worker submits a Fayda number and front/back ID photos, which we check manually, plus references." },
  { q: "How much does it cost to hire?", a: "Monthly rates start from ETB 3,500 for waitstaff up to ETB 9,000 for experienced cooks." },
  { q: "Is registration free for workers?", a: "Yes — register through Join → Employee with your ID and basic details." },
  { q: "Which areas do you cover?", a: "Addis Ababa: Bole, Kazanchis, CMC, Megenagna, Piassa, Sarbet and Gerji." },
];

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useSession();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <button
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div
        className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto rounded-r-3xl bg-card shadow-[var(--shadow-card)]"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <span className="text-lg font-bold">{BRAND.name} Menu</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border"
            style={{ borderColor: "var(--brand)", color: "var(--brand-dark)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!user && (
          <div className="grid grid-cols-2 gap-3 border-b border-border/60 px-5 py-4">
            <Link
              to="/auth"
              onClick={onClose}
              className="rounded-full border py-3 text-center text-sm font-bold"
              style={{ borderColor: "var(--brand)", color: "var(--brand-dark)" }}
            >
              Log In
            </Link>
            <Link
              to="/join"
              onClick={onClose}
              className="rounded-full py-3 text-center text-sm font-bold"
              style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}
            >
              Sign Up
            </Link>
          </div>
        )}

        {groups.map((g) => (
          <div key={g.title} className="border-b border-border/60 px-5 py-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {g.title}
            </div>
            <div className="mt-3 space-y-1">
              {g.items.map((i) => (
                <Link
                  key={i.label}
                  to={i.to}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-2xl px-2 py-2.5 text-base font-medium transition hover:bg-muted/60"
                >
                  <span style={{ color: "var(--brand-dark)" }}>{i.icon}</span>
                  {i.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="border-b border-border/60 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Frequently asked
          </div>
          <div className="mt-3 space-y-2">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl bg-muted/40 px-3 py-2.5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold marker:content-none">
                  {f.q}
                  <span className="text-lg transition group-open:rotate-45" style={{ color: "var(--brand-dark)" }}>+</span>
                </summary>
                <p className="mt-2 text-xs text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
        <SettingsSection user={user} onClose={onClose} />

      </div>
    </div>
  );
}
function SettingsSection({ user, onClose }: { user: { id: string } | null | undefined; onClose: () => void }) {
  const { theme, toggle } = useTheme();
  const { lang, setLang } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="px-5 py-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Settings className="h-4 w-4" /> Settings
      </div>


      <button
        type="button"
        onClick={toggle}
        className="mt-3 flex w-full items-center justify-between gap-3 rounded-2xl bg-muted/40 px-3 py-2.5 text-sm font-medium"
      >
        <span className="flex items-center gap-3">
          <span style={{ color: "var(--brand-dark)" }}>
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </span>
          {theme === "dark" ? "Dark mode" : "Light mode"}
        </span>
        <span
          aria-hidden
          className="relative h-6 w-11 rounded-full transition"
          style={{ background: theme === "dark" ? "var(--brand)" : "var(--border)" }}
        >
          <span
            className="absolute top-0.5 h-5 w-5 rounded-full bg-card transition-all"
            style={{ left: theme === "dark" ? "1.375rem" : "0.125rem" }}
          />
        </span>
      </button>

      <div className="mt-3 rounded-2xl bg-muted/40 p-2">
        <div className="px-1 pb-1 text-xs font-semibold text-muted-foreground">Language</div>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm"
          >
            <span>
              <span className="font-medium">{l.native}</span>
              {l.native !== l.label && <span className="ml-1 text-xs text-muted-foreground">{l.label}</span>}
            </span>
            {l.code === lang && <Check className="h-4 w-4" style={{ color: "var(--brand-dark)" }} />}
          </button>
        ))}
      </div>

      {user && (
        <>
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-muted/40 px-3 py-2.5 text-sm font-medium"
          >
            <span style={{ color: "var(--brand-dark)" }}><KeyRound className="h-5 w-5" /></span>
            Change password
          </button>
          {showPassword && (
            <div className="mt-3">
              <ChangePassword confirmRequired={false} onDone={() => setShowPassword(false)} />
            </div>
          )}

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              onClose();
            }}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-destructive"
          >
            <LogOut className="h-5 w-5" /> Log out
          </button>
        </>
      )}
    </div>
  );
}
