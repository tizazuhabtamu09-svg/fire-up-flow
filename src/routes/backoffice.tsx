import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { staffCan, staffContext, type StaffContext } from "@/components/backoffice/context";
import { ChangePassword } from "@/components/ChangePassword";
import { fetchStaffAccess } from "@/lib/onboarding";

export const Route = createFileRoute("/backoffice")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Back office — Agaze/አጋዝ" },
      { name: "description", content: "Staff back office for Agaze/አጋዝ: document review, roles and verification queues." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BackOfficeLayout,
});

const NAV: { to: string; label: string; exact: boolean; adminOnly?: boolean; permission?: string }[] = [
  { to: "/backoffice", label: "Overview", exact: true },
  { to: "/backoffice/users", label: "User management", exact: false, adminOnly: true },
  { to: "/backoffice/documents", label: "Document review", exact: false },
  { to: "/backoffice/requests", label: "Employee requests", exact: false },
  { to: "/backoffice/jobs", label: "Job posts", exact: false },
  { to: "/backoffice/compliance", label: "Compliance logs", exact: false },
  { to: "/backoffice/accounts", label: "Create accounts", exact: false },
  { to: "/backoffice/pricing", label: "Pricing", exact: false, permission: "pricing" },
  { to: "/backoffice/payments", label: "Payments", exact: false, permission: "payments" },
  { to: "/backoffice/roles", label: "Roles & permissions", exact: false, adminOnly: true },
  { to: "/backoffice/settings", label: "Account settings", exact: false },
];

function BackOfficeLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [staff, setStaff] = useState<StaffContext | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [phase, setPhase] = useState<"checking" | "login" | "ready">("checking");

  const evaluate = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setStaff(null);
      setPhase("login");
      return;
    }
    const [access, { data: profile }, { data: sub }] = await Promise.all([
      fetchStaffAccess(user.id),
      supabase.from("profiles").select("full_name, must_change_password").eq("id", user.id).maybeSingle(),
      supabase.from("sub_admins").select("permissions, full_name, active").eq("user_id", user.id).maybeSingle(),
    ]);
    const { isAdmin, isKyc, isSubAdmin, isStaff } = access;
    if (!isStaff) {
      navigate({ to: "/access-denied", replace: true });
      return;
    }
    if (profile?.must_change_password) {
      setMustChangePassword(true);
      setPhase("ready");
      return;
    }
    setMustChangePassword(false);
    setStaff({
      userId: user.id,
      name: profile?.full_name || sub?.full_name || user.email || "Staff",
      kind: isSubAdmin ? "sub-admin" : isAdmin ? "admin" : "kyc",
      isAdmin,
      isKyc,
      permissions: (sub?.permissions as Record<string, boolean> | null) ?? {},
    });
    setPhase("ready");

  }, [navigate]);

  useEffect(() => {
    evaluate();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") evaluate();
    });
    return () => sub.subscription.unsubscribe();
  }, [evaluate]);

  async function signOut() {
    await supabase.auth.signOut();
    setStaff(null);
    setPhase("login");
  }

  if (phase === "checking") {
    return <div className="container-page py-24 text-center text-muted-foreground">Checking staff access…</div>;
  }

  if (mustChangePassword) {
    return (
      <div className="container-page mx-auto max-w-lg py-16">
        <h1 className="text-2xl font-bold">Set your own password</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">
          Your staff account was created with a temporary password. Create and confirm a new one to open the back office.
        </p>
        <ChangePassword
          confirmRequired={false}
          title="Create a new password"
          description="This replaces the temporary password you were given."
          onDone={evaluate}
        />
      </div>
    );
  }

  if (phase === "login" || !staff) return <BackOfficeLogin onSignedIn={evaluate} />;


  const links = NAV.filter(
    (l) => (!l.adminOnly || staff.isAdmin) && (!l.permission || staffCan(staff, l.permission)),
  );

  return (
    <staffContext.Provider value={staff}>
      <div className="container-page py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Back office</p>
            <h1 className="text-3xl font-bold">Staff workspace</h1>
            <p className="font-amharic text-muted-foreground">የሰራተኞች ማዕከል</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">{staff.name}</p>
            <p className="text-muted-foreground capitalize">{staff.kind.replace("-", " ")}</p>
            <button onClick={signOut} className="mt-1 text-xs font-semibold text-primary underline">Sign out</button>
          </div>
        </div>

        <nav className="mt-6 flex gap-2 overflow-x-auto rounded-full bg-secondary p-1 text-sm font-semibold">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.exact }}
              className="whitespace-nowrap rounded-full px-4 py-2 text-muted-foreground transition hover:text-foreground data-[status=active]:bg-card data-[status=active]:text-foreground data-[status=active]:shadow-sm"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8" key={pathname}>
          <Outlet />
        </div>
      </div>
    </staffContext.Provider>
  );
}

function BackOfficeLogin({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) return setError(err.message);
    onSignedIn();
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <form onSubmit={submit} className="card-soft w-full max-w-md p-8">
        <ShieldCheck className="h-9 w-9 text-primary" />
        <h1 className="mt-3 text-2xl font-bold">Back office sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Staff only — admins, sub-admins and KYC reviewers. Sign in to open the requested view.
        </p>

        <label className="mt-6 block text-sm font-semibold">
          Work email
          <span className="mt-1 flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2.5 focus-within:border-primary">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent font-normal outline-none"
              placeholder="staff@agaze.et"
            />
          </span>
        </label>

        <label className="mt-4 block text-sm font-semibold">
          Password
          <span className="mt-1 flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2.5 focus-within:border-primary">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <input
              type={show ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent font-normal outline-none"
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShow(!show)} className="text-muted-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <button disabled={busy} className="btn-brand mt-6 w-full disabled:opacity-60">
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Looking for the customer app? <Link to="/auth" className="text-primary underline">Sign in here</Link>.
        </p>
      </form>
    </div>
  );
}
